// Run locally: node --experimental-vm-modules --test scripts/security-regression.test.mjs
// No application imports escape the explicit VM mock allowlist; no real DB/mail/timers.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import vm from "node:vm";

const NOW = new Date("2026-11-10T14:40:00Z");
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [NOW.getTime()])); }
  static now() { return NOW.getTime(); }
}
const forbidden = () => { throw new Error("Real timers/network are forbidden in offline tests"); };

async function load(file, mocks, env = {}) {
  const context = vm.createContext({
    Date: Clock, Buffer, console: { log() {}, warn() {}, error() {} },
    process: { env: { DATABASE_URL: "offline-mock-only", ...env } },
    setTimeout: forbidden, setInterval: forbidden, fetch: forbidden,
  });
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const code = file.endsWith(".ts") ? stripTypeScriptTypes(source) : source;
  const module = new vm.SourceTextModule(code, { context, identifier: file });
  await module.link(specifier => {
    assert.ok(Object.hasOwn(mocks, specifier), `Unmocked import blocked: ${specifier}`);
    const values = mocks[specifier];
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return module.namespace;
}

const tableNames = ["users", "memberships", "invitationTokens", "memberSessions", "auditLogs",
  "contentCategories", "courseLessons", "courseSections", "courses", "mediaAssets", "teachingAssets", "teachings"];
const tables = Object.fromEntries(tableNames.map(name => [name, new Proxy({ name }, {
  get(target, key) { return key === "name" ? target.name : { table: name, key }; },
})]));
const eq = (column, value) => row => row[column.key] === value;
const orm = {
  eq, and: (...conditions) => row => conditions.every(condition => condition(row)),
  isNull: column => row => row[column.key] == null,
  gt: (column, value) => row => row[column.key] > value,
  sql: () => undefined, asc() {}, desc() {}, count() {}, like() {}, or() {},
};

function database(accountStatus = "invited") {
  const store = {
    users: [{ id: 7, role: "user", accountStatus, passwordHash: "old-hash", email: "member@example.invalid" }],
    memberships: [{ id: 1, userId: 7, status: "active" }],
    invitationTokens: [
      { id: 1, userId: 7, tokenHash: "current", expiresAt: new Date(NOW.getTime() + 60_000), consumedAt: null },
      { id: 2, userId: 7, tokenHash: "older", expiresAt: new Date(NOW.getTime() + 60_000), consumedAt: null },
      { id: 3, userId: 8, tokenHash: "other", expiresAt: new Date(NOW.getTime() + 60_000), consumedAt: null },
    ],
    memberSessions: [
      { id: 1, userId: 7, revokedAt: null },
      { id: 2, userId: 7, revokedAt: new Date(NOW.getTime() - 1000) },
      { id: 3, userId: 8, revokedAt: null },
    ], auditLogs: [],
  };
  const events = [];
  let failTable;
  const builder = (kind, selection) => {
    let table, predicate = () => true, values, duplicate, limit = Infinity, joined = false;
    const run = () => {
      const name = table.name;
      events.push({ kind, table: name });
      if (kind !== "select" && failTable === name) throw new Error("Injected DB failure");
      if (kind === "select") {
        return (store[name] ?? []).filter(predicate).slice(0, limit).map(row => {
          if (joined) return { invitation: row, user: store.users.find(user => user.id === row.userId) };
          if (selection) return Object.fromEntries(Object.entries(selection).map(([key, column]) => [key, row[column.key]]));
          return { ...row };
        });
      }
      if (kind === "update") {
        for (const row of store[name] ?? []) if (predicate(row)) Object.assign(row, values);
      } else {
        store[name] ??= [];
        const existing = duplicate && store[name].find(row => row.userId === values.userId);
        if (existing) Object.assign(existing, duplicate);
        else store[name].push({ id: store[name].length + 1, ...values });
      }
      return { affectedRows: 1 };
    };
    const query = {
      from(value) { table = value; return this; },
      innerJoin() { joined = true; return this; },
      where(value) { predicate = value; return this; },
      limit(value) { limit = value; return this; },
      for(mode) { events.push({ kind: "lock", table: table.name, mode }); return this; },
      set(value) { values = value; return this; },
      values(value) { values = value; return this; },
      onDuplicateKeyUpdate({ set }) { duplicate = set; return this; },
      then(resolve, reject) { return Promise.resolve().then(run).then(resolve, reject); },
    };
    if (kind !== "select") table = selection;
    return query;
  };
  const db = {
    select: selection => builder("select", selection),
    update: table => builder("update", table),
    insert: table => builder("insert", table),
    async transaction(callback) {
      events.push({ kind: "begin" });
      const snapshot = structuredClone(store);
      try {
        const result = await callback(db);
        events.push({ kind: "commit" });
        return result;
      } catch (error) {
        for (const key of Object.keys(store)) delete store[key];
        Object.assign(store, snapshot);
        events.push({ kind: "rollback" });
        throw error;
      }
    },
  };
  return { db, store, events, failOn(name) { failTable = name; } };
}

async function authDb(fixture) {
  return load("server/db.ts", {
    "drizzle-orm": orm,
    "drizzle-orm/mysql2": { drizzle: () => fixture.db },
    "../drizzle/schema": { ...tables, InsertUser: undefined },
  });
}
async function adminDb(fixture) {
  return load("server/adminData.ts", {
    crypto: { randomBytes: size => Buffer.alloc(size) },
    "drizzle-orm": orm, "../drizzle/schema": tables,
    "./auth": { createOpaqueToken: () => "mock-new-link", normalizeEmail: email => email.trim().toLowerCase(), sha256: () => "new-hash" },
    "./db": { getDb: async () => fixture.db },
  });
}
const access = { actorUserId: 99, userId: 7, accountStatus: "suspended", tier: "silver", membershipStatus: "active" };

test("suspended invitation acceptance is rejected under a locking transaction, without writes", async () => {
  const fixture = database("suspended");
  const api = await authDb(fixture);
  assert.equal(await api.acceptInvitationByTokenHash("current", "replacement-hash"), undefined);
  assert.ok(fixture.events.some(event => event.kind === "lock" && event.mode === "update"));
  assert.equal(fixture.events.filter(event => ["insert", "update"].includes(event.kind)).length, 0);
  assert.equal(fixture.store.users[0].passwordHash, "old-hash");
});

test("acceptance replaces password and revokes every predecessor link/session for only that user", async () => {
  const fixture = database();
  const api = await authDb(fixture);
  const result = await api.acceptInvitationByTokenHash("current", "replacement-hash");
  assert.equal(result.user.accountStatus, "active");
  assert.equal(result.user.passwordHash, "replacement-hash");
  assert.ok(fixture.store.invitationTokens.slice(0, 2).every(row => row.consumedAt instanceof Date));
  assert.equal(fixture.store.invitationTokens[2].consumedAt, null);
  assert.ok(fixture.store.memberSessions[0].revokedAt instanceof Date);
  assert.equal(fixture.store.memberSessions[1].revokedAt.getTime(), NOW.getTime() - 1000);
  assert.equal(fixture.store.memberSessions[2].revokedAt, null);
  assert.equal(await api.acceptInvitationByTokenHash("older", "another-hash"), undefined);
  assert.equal(await api.acceptInvitationByTokenHash("current", "another-hash"), undefined);
});

for (const kind of ["expired", "consumed", "missing"]) {
  test(`${kind} invitation cannot replace a password`, async () => {
    const fixture = database();
    if (kind === "expired") fixture.store.invitationTokens[0].expiresAt = new Date(NOW);
    if (kind === "consumed") fixture.store.invitationTokens[0].consumedAt = new Date(NOW);
    const api = await authDb(fixture);
    assert.equal(await api.acceptInvitationByTokenHash(kind === "missing" ? "missing" : "current", "replacement"), undefined);
    assert.equal(fixture.store.users[0].passwordHash, "old-hash");
  });
}

test("password/session revocation failure rolls back invitation acceptance", async () => {
  const fixture = database();
  fixture.failOn("memberSessions");
  const api = await authDb(fixture);
  await assert.rejects(api.acceptInvitationByTokenHash("current", "replacement"), /Injected DB failure/);
  assert.equal(fixture.store.users[0].passwordHash, "old-hash");
  assert.equal(fixture.store.invitationTokens[0].consumedAt, null);
  assert.equal(fixture.events.at(-1).kind, "rollback");
});

test("refresh consumes predecessors before inserting replacement in one locked transaction", async () => {
  const fixture = database();
  const api = await adminDb(fixture);
  assert.ok(await api.refreshMemberInvitation(99, 7));
  assert.ok(fixture.store.invitationTokens.slice(0, 2).every(row => row.consumedAt));
  assert.equal(fixture.store.invitationTokens[2].consumedAt, null);
  assert.equal(fixture.store.invitationTokens.at(-1).tokenHash, "new-hash");
  assert.equal(fixture.store.invitationTokens.at(-1).consumedAt, undefined);
  const update = fixture.events.findIndex(event => event.kind === "update" && event.table === "invitationTokens");
  const insert = fixture.events.findIndex(event => event.kind === "insert" && event.table === "invitationTokens");
  assert.ok(update < insert);
  assert.ok(fixture.events.some(event => event.kind === "lock" && event.table === "users"));
  assert.equal(fixture.events.at(-1).kind, "commit");
});

test("refresh refuses suspended members and rolls back invalidation on insertion failure", async () => {
  const suspended = database("suspended");
  assert.equal(await (await adminDb(suspended)).refreshMemberInvitation(99, 7), null);
  assert.equal(suspended.events.filter(event => event.kind === "update" || event.kind === "insert").length, 0);
  const fixture = database();
  fixture.failOn("auditLogs");
  await assert.rejects((await adminDb(fixture)).refreshMemberInvitation(99, 7), /Injected DB failure/);
  assert.equal(fixture.store.invitationTokens.length, 3);
  assert.equal(fixture.store.invitationTokens[0].consumedAt, null);
});

test("suspension consumes invitations/revokes sessions; reactivation does not restore them", async () => {
  const fixture = database("active");
  const api = await adminDb(fixture);
  await api.updateMemberAccess(access);
  assert.equal(fixture.store.users[0].accountStatus, "suspended");
  assert.ok(fixture.store.invitationTokens[0].consumedAt);
  assert.ok(fixture.store.memberSessions[0].revokedAt);
  assert.equal(fixture.store.invitationTokens[2].consumedAt, null);
  assert.equal(fixture.store.memberSessions[2].revokedAt, null);
  await api.updateMemberAccess({ ...access, accountStatus: "active" });
  assert.ok(fixture.store.invitationTokens[0].consumedAt);
  assert.ok(fixture.store.memberSessions[0].revokedAt);
});

test("suspension rolls back account status and link changes when session revocation fails", async () => {
  const fixture = database("active");
  fixture.failOn("memberSessions");
  await assert.rejects((await adminDb(fixture)).updateMemberAccess(access), /Injected DB failure/);
  assert.equal(fixture.store.users[0].accountStatus, "active");
  assert.equal(fixture.store.invitationTokens[0].consumedAt, null);
});

function reminderFixture(membership = {}, changeBeforeSend) {
  const state = { status: "active", startsAt: null, endsAt: null, accountStatus: "active", frequency: "daily", ...membership };
  const preference = { id: 1, userId: 7, frequency: "daily", timezone: "America/Denver", preferredHour: 8, nextDueAt: NOW, email: "old@example.invalid", name: "Old" };
  const queries = [], emails = [];
  let deliveryStatus, ended = false;
  const eligible = at => state.accountStatus === "active" && state.status === "active" && state.frequency === "daily"
    && (!state.startsAt || state.startsAt <= at) && (!state.endsAt || state.endsAt > at);
  function assertBounds(sql) {
    assert.ok(sql.includes("(m.startsAt IS NULL OR m.startsAt <= ?)"));
    assert.ok(sql.includes("(m.endsAt IS NULL OR m.endsAt > ?)"));
    assert.ok(sql.includes("u.accountStatus = 'active'"));
    assert.ok(sql.includes("m.status = 'active'"));
  }
  const connection = {
    async query(sql) {
      queries.push(sql);
      if (sql.includes("GET_LOCK")) return [[{ acquired: 1 }]];
      assert.ok(sql.includes("RELEASE_LOCK"));
      return [[]];
    },
    async execute(sql, params) {
      queries.push(sql);
      if (sql.includes("SELECT p.id")) {
        assertBounds(sql);
        assert.equal(params.length, 3);
        assert.equal(params[0].getTime(), params[1].getTime());
        assert.equal(params[1].getTime(), params[2].getTime());
        return [eligible(params[1]) ? [preference] : []];
      }
      if (sql.includes("SELECT * FROM daily_teachings")) return [[{ id: 10, status: "published", body: "Mock premium teaching" }]];
      if (sql.includes("INSERT IGNORE")) { deliveryStatus = "pending"; return [{ affectedRows: 1 }]; }
      if (sql.includes("SELECT id, status")) return [[{ id: 20, status: deliveryStatus, attemptCount: 0 }]];
      if (sql.includes("SET status = 'sending'")) {
        deliveryStatus = "sending";
        if (changeBeforeSend) changeBeforeSend(state);
        return [{ affectedRows: 1 }];
      }
      if (sql.includes("SELECT u.email")) {
        assertBounds(sql);
        assert.match(sql, /p\.id = \? AND p\.userId = \? AND p\.frequency = \?/);
        assert.deepEqual(Array.from(params.slice(0, 3)), [1, 7, "daily"]);
        assert.equal(params[3].getTime(), NOW.getTime());
        assert.equal(params[4].getTime(), NOW.getTime());
        if (state.throwRecheck) throw new Error("Recheck unavailable");
        return [eligible(params[3]) ? [{ email: "fresh@example.invalid", name: "Fresh" }] : []];
      }
      if (sql.includes("SET status = 'skipped'")) { deliveryStatus = "skipped"; return [{ affectedRows: 1 }]; }
      if (sql.includes("SET status = 'sent'")) { deliveryStatus = "sent"; return [{ affectedRows: 1 }]; }
      if (sql.includes("SET status = 'failed'")) { deliveryStatus = "failed"; return [{ affectedRows: 1 }]; }
      if (sql.includes("UPDATE daily_teaching_preferences SET lastSentAt")) return [{ affectedRows: 1 }];
      throw new Error(`Unexpected SQL in mock: ${sql}`);
    },
    async beginTransaction() {}, async commit() {}, async rollback() {},
    async end() { ended = true; },
  };
  return { connection, queries, emails, get status() { return deliveryStatus; }, get ended() { return ended; } };
}
async function worker(fixture) {
  return load("server/dailyTeachingWorker.ts", {
    "mysql2/promise": { default: { createConnection: async () => fixture.connection } },
    "./dailyTeaching": { dailySequenceForDate: () => 1, calculateNextDueAt: () => new Date(NOW.getTime() + 86_400_000) },
    "./dailyTeachingMailer": { sendDailyTeachingEmail: async input => {
      assert.ok(fixture.queries.at(-1).includes("SELECT u.email"), "Eligibility recheck must immediately precede email");
      fixture.emails.push(input);
      return { messageId: "mock-id" };
    } },
  });
}

for (const [name, dates, allowed] of [
  ["unbounded", {}, true],
  ["start exactly now", { startsAt: NOW }, true],
  ["future start", { startsAt: new Date(NOW.getTime() + 1) }, false],
  ["end exactly now", { endsAt: NOW }, false],
  ["expired end", { endsAt: new Date(NOW.getTime() - 1) }, false],
  ["future end", { endsAt: new Date(NOW.getTime() + 1) }, true],
  ["paused membership", { status: "paused" }, false],
  ["suspended account", { accountStatus: "suspended" }, false],
]) {
  test(`reminder selection matches portal date/status bounds: ${name}`, async () => {
    const fixture = reminderFixture(dates);
    const result = await (await worker(fixture)).processDueDailyTeachingReminders(NOW);
    assert.equal(result.due, allowed ? 1 : 0);
    assert.equal(fixture.emails.length, allowed ? 1 : 0);
    assert.equal(fixture.ended, true);
    if (allowed) assert.equal(fixture.emails[0].recipientEmail, "fresh@example.invalid");
  });
}

for (const [name, change] of [
  ["expiry", state => { state.endsAt = NOW; }],
  ["future start", state => { state.startsAt = new Date(NOW.getTime() + 1); }],
  ["suspension", state => { state.accountStatus = "suspended"; }],
  ["membership cancellation", state => { state.status = "cancelled"; }],
  ["reminder opt-out", state => { state.frequency = "off"; }],
]) {
  test(`delivery-time ${name} skips claimed reminder without sending`, async () => {
    const fixture = reminderFixture({}, change);
    const result = await (await worker(fixture)).processDueDailyTeachingReminders(NOW);
    assert.equal(result.skipped, 1);
    assert.equal(result.sent, 0);
    assert.equal(fixture.emails.length, 0);
    assert.equal(fixture.status, "skipped");
    assert.equal(fixture.queries.some(sql => sql.includes("SET lastSentAt")), false);
  });
}

test("delivery recheck uses current time instead of stale batch time", async () => {
  const fixture = reminderFixture({ endsAt: NOW });
  const batchTime = new Date(NOW.getTime() - 60_000);
  const result = await (await worker(fixture)).processDueDailyTeachingReminders(batchTime);
  assert.equal(result.due, 1);
  assert.equal(result.skipped, 1);
  assert.equal(fixture.emails.length, 0);
});

test("delivery authorization-query error fails closed, without SMTP", async () => {
  const fixture = reminderFixture({}, state => { state.throwRecheck = true; });
  const result = await (await worker(fixture)).processDueDailyTeachingReminders(NOW);
  assert.equal(result.failed, 1);
  assert.equal(fixture.status, "failed");
  assert.equal(fixture.emails.length, 0);
});

test("admin bootstrap password replacement revokes sessions and links before commit (fully mocked)", async () => {
  const operations = [];
  const connection = {
    async beginTransaction() { operations.push("begin"); },
    async execute(sql, params) {
      operations.push(sql);
      if (sql.startsWith("SELECT id")) return [[{ id: 7 }]];
      if (sql.startsWith("UPDATE member_sessions") || sql.startsWith("UPDATE invitation_tokens")) {
        assert.equal(params[0], 7);
        assert.ok(sql.includes("IS NULL"));
      }
      return [{ affectedRows: 1 }];
    },
    async commit() { operations.push("commit"); },
    async rollback() { operations.push("rollback"); },
    async end() { operations.push("end"); },
  };
  await load("scripts/create-admin.mjs", {
    "node:crypto": { randomBytes: size => Buffer.alloc(size), scrypt: (_password, _salt, size, _options, callback) => callback(null, Buffer.alloc(size)) },
    "mysql2/promise": { default: { createConnection: async () => connection } },
  }, { ADMIN_EMAIL: "offline@example.invalid", ADMIN_NAME: "Offline", ADMIN_PASSWORD: "Dummy-Only-Test-1" });
  assert.ok(operations.findIndex(sql => sql.startsWith("UPDATE member_sessions")) < operations.indexOf("commit"));
  assert.ok(operations.findIndex(sql => sql.startsWith("UPDATE invitation_tokens")) < operations.indexOf("commit"));
  assert.equal(operations.at(-1), "end");
});
