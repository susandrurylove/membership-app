import { createHash, timingSafeEqual } from "crypto";
import type { Express, Request } from "express";
import mysql from "mysql2/promise";
import { hashPassword } from "../auth";

const RECOVERY_TOKEN_SHA256 = "0781734dd1bbe8efc64a42c79fc1135f42c8af6f86e73f2480be897e56dc48f1";
const RECOVERY_DELIVERY_ID = "authorized-account-recovery-2026-08-26-v1";
const TARGET_ACCOUNTS = [
  { email: "susan@susandrury.com", name: "Susan Drury", role: "admin" },
  { email: "paul@creativelab.tv", name: "Paul", role: "user" },
  { email: "andreea.plesea@gmail.com", name: "Andreea Plesea", role: "user" },
] as const;

function hasValidRecoveryToken(req: Request) {
  const authorization = req.header("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return false;

  const actual = createHash("sha256").update(token).digest();
  const expected = Buffer.from(RECOVERY_TOKEN_SHA256, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function isStrongEnough(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function registerAccountRecoveryRoute(app: Express) {
  app.post("/api/internal/recover-authorized-accounts", async (req, res) => {
    if (!hasValidRecoveryToken(req)) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const password = req.body?.password;
    if (!isStrongEnough(password)) {
      res.status(400).json({
        error: "Password must have at least 12 characters with uppercase, lowercase, and a number.",
      });
      return;
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      res.status(503).json({ error: "Database is not configured" });
      return;
    }

    const connection = await mysql.createConnection(databaseUrl);
    try {
      await connection.beginTransaction();

      try {
        await connection.execute(
          `INSERT INTO webhook_deliveries
            (provider, deliveryId, eventType, payloadHash, status, createdAt)
           VALUES ('system', ?, 'authorized_account_recovery', ?, 'received', NOW())`,
          [RECOVERY_DELIVERY_ID, RECOVERY_TOKEN_SHA256]
        );
      } catch (error: any) {
        if (error?.code === "ER_DUP_ENTRY") {
          await connection.rollback();
          res.status(409).json({ error: "Recovery was already applied" });
          return;
        }
        throw error;
      }

      const recovered: Array<{ email: string; role: string }> = [];
      for (const account of TARGET_ACCOUNTS) {
        const passwordHash = await hashPassword(password);
        const openId = `local_recovery_${Buffer.from(account.email).toString("base64url").slice(0, 42)}`;

        await connection.execute(
          `INSERT INTO users
            (openId, name, email, loginMethod, passwordHash, accountStatus, role, invitationAcceptedAt, createdAt, updatedAt, lastSignedIn)
           VALUES (?, ?, ?, 'password', ?, 'active', ?, NOW(), NOW(), NOW(), NULL)
           ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            loginMethod = 'password',
            passwordHash = VALUES(passwordHash),
            accountStatus = 'active',
            role = IF(VALUES(email) = 'susan@susandrury.com', 'admin', role),
            invitationAcceptedAt = COALESCE(invitationAcceptedAt, NOW()),
            updatedAt = NOW()`,
          [openId, account.name, account.email, passwordHash, account.role]
        );

        const [rows] = await connection.execute<mysql.RowDataPacket[]>(
          "SELECT id, role FROM users WHERE email = ? LIMIT 1",
          [account.email]
        );
        const userId = rows[0]?.id;
        if (!userId) throw new Error(`Could not resolve recovered account: ${account.email}`);

        await connection.execute(
          `INSERT INTO memberships
            (userId, tier, status, source, startsAt, endsAt, graceEndsAt, createdAt, updatedAt)
           VALUES (?, 'custom', 'active', 'manual', NOW(), NULL, NULL, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
            status = 'active',
            startsAt = COALESCE(startsAt, NOW()),
            endsAt = NULL,
            graceEndsAt = NULL,
            updatedAt = NOW()`,
          [userId]
        );

        await connection.execute(
          "UPDATE member_sessions SET revokedAt = COALESCE(revokedAt, NOW()) WHERE userId = ?",
          [userId]
        );

        await connection.execute(
          `INSERT INTO audit_logs
            (actorUserId, action, targetType, targetId, summary, metadata, createdAt)
           VALUES (NULL, 'system.account_recovered', 'user', ?, ?, JSON_OBJECT('email', ?), NOW())`,
          [String(userId), `Recovered authorized account ${account.email}`, account.email]
        );

        recovered.push({ email: account.email, role: rows[0].role });
      }

      await connection.execute(
        `UPDATE webhook_deliveries
         SET status = 'processed', processedAt = NOW()
         WHERE provider = 'system' AND deliveryId = ?`,
        [RECOVERY_DELIVERY_ID]
      );
      await connection.commit();
      res.status(200).json({ recovered });
    } catch (error) {
      await connection.rollback();
      console.error("Authorized account recovery failed", error);
      res.status(500).json({ error: "Account recovery failed" });
    } finally {
      await connection.end();
    }
  });
}
