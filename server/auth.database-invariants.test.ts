import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const schema = fs.readFileSync(path.join(root, "drizzle", "schema.ts"), "utf8");
const adminBootstrap = fs.readFileSync(path.join(root, "scripts", "create-admin.mjs"), "utf8");
const authRouter = fs.readFileSync(path.join(root, "server", "routers", "auth.ts"), "utf8");
const serverEntry = fs.readFileSync(path.join(root, "server", "_core", "index.ts"), "utf8");

describe("P0 authentication database invariants", () => {
  it("QA-DATABASE-INTEGRITY-001 keeps user email and session tokens uniquely constrained", () => {
    expect(schema).toContain('email: varchar("email", { length: 320 }).unique()');
    expect(schema).toContain('tokenHashUnique: uniqueIndex("member_sessions_token_hash_unique")');
    expect(schema).toContain('tokenHashUnique: uniqueIndex("invitation_tokens_token_hash_unique")');
    expect(schema).toContain('tokenHashUnique: uniqueIndex("password_reset_tokens_token_hash_unique")');
  });

  it("QA-DATABASE-INTEGRITY-002 requires one membership per user and preserves entitlement statuses", () => {
    expect(schema).toContain('userUnique: uniqueIndex("memberships_user_unique").on(table.userId)');
    expect(schema).toContain('["pending", "active", "paused", "cancelled", "expired"]');
    expect(schema).toContain('source: mysqlEnum("source", ["manual", "thrivecart"])');
  });

  it("QA-ACCOUNT-BOOTSTRAP-RECOVERY-001 stores password hashes and requires active-account timestamps", () => {
    expect(schema).toContain('passwordHash: varchar("passwordHash", { length: 255 })');
    expect(schema).toContain('accountStatus: mysqlEnum("accountStatus", ["invited", "active", "suspended"])');
    expect(schema).toMatch(/lastSignedIn:\s*timestamp\("lastSignedIn"\)\.defaultNow\(\)\.notNull\(\)/);
  });

  it("QA-ACCOUNT-BOOTSTRAP-RECOVERY-002 bootstraps an active administrator and active membership transactionally", () => {
    expect(adminBootstrap).toContain("await connection.beginTransaction()");
    expect(adminBootstrap).toContain("'active', 'admin', NOW(), NOW(), NOW(), NOW()");
    expect(adminBootstrap).toContain("ON DUPLICATE KEY UPDATE");
    expect(adminBootstrap).toContain("VALUES (?, 'custom', 'active', 'manual', NOW(), NOW(), NOW())");
    expect(adminBootstrap).toContain("await connection.commit()");
    expect(adminBootstrap).toContain("await connection.rollback()");
  });

  it("QA-LOGIN-VALIDATION-001 keeps the login input bounded and the failure message non-enumerating", () => {
    expect(authRouter).toContain("email: z.string().trim().email().max(320)");
    expect(authRouter).toContain("password: z.string().min(12).max(200)");
    expect(authRouter).toContain("The email or password was not recognized.");
    expect(authRouter).not.toMatch(/No account exists|Email not found|Unknown user/);
  });

  it("QA-ACCOUNT-BOOTSTRAP-RECOVERY-003 exposes no temporary account-recovery route in the clean server", () => {
    expect(serverEntry).not.toContain("recover-authorized-accounts");
    expect(serverEntry).not.toContain("registerAccountRecoveryRoute");
    expect(fs.existsSync(path.join(root, "server", "routes", "accountRecovery.ts"))).toBe(false);
  });
});
