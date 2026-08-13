import { and, eq, gt, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  invitationTokens,
  InsertUser,
  memberSessions,
  memberships,
  users,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function checkDatabaseHealth() {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("[Database] Health check failed:", error);
    return false;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getMembershipByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1);
  return result[0];
}

export async function createMemberSession(input: {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  ipHash: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(memberSessions).values(input);
}

export async function getSessionWithUserByTokenHash(tokenHash: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({ session: memberSessions, user: users })
    .from(memberSessions)
    .innerJoin(users, eq(memberSessions.userId, users.id))
    .where(
      and(
        eq(memberSessions.tokenHash, tokenHash),
        isNull(memberSessions.revokedAt),
        gt(memberSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  return result[0];
}

export async function touchMemberSession(sessionId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(memberSessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(memberSessions.id, sessionId));
}

export async function revokeMemberSessionByTokenHash(tokenHash: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(memberSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(memberSessions.tokenHash, tokenHash), isNull(memberSessions.revokedAt)));
}

export async function getInvitationByTokenHash(tokenHash: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({ invitation: invitationTokens, user: users })
    .from(invitationTokens)
    .innerJoin(users, eq(invitationTokens.userId, users.id))
    .where(
      and(
        eq(invitationTokens.tokenHash, tokenHash),
        isNull(invitationTokens.consumedAt),
        gt(invitationTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  return result[0];
}

export async function acceptInvitationByTokenHash(tokenHash: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  return db.transaction(async tx => {
    const rows = await tx
      .select({ invitation: invitationTokens, user: users })
      .from(invitationTokens)
      .innerJoin(users, eq(invitationTokens.userId, users.id))
      .where(
        and(
          eq(invitationTokens.tokenHash, tokenHash),
          isNull(invitationTokens.consumedAt),
          gt(invitationTokens.expiresAt, new Date())
        )
      )
      .limit(1)
      .for("update");

    const row = rows[0];
    if (!row) return undefined;

    const acceptedAt = new Date();
    await tx
      .update(users)
      .set({
        passwordHash,
        loginMethod: "password",
        accountStatus: "active",
        invitationAcceptedAt: acceptedAt,
        lastSignedIn: acceptedAt,
      })
      .where(eq(users.id, row.user.id));
    await tx
      .update(invitationTokens)
      .set({ consumedAt: acceptedAt })
      .where(eq(invitationTokens.id, row.invitation.id));

    const updatedUsers = await tx.select().from(users).where(eq(users.id, row.user.id)).limit(1);
    const updatedMemberships = await tx
      .select()
      .from(memberships)
      .where(eq(memberships.userId, row.user.id))
      .limit(1);

    return { user: updatedUsers[0]!, membership: updatedMemberships[0] ?? null };
  });
}
