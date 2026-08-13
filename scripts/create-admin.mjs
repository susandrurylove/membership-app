import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import mysql from "mysql2/promise";

const { DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;

if (!DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!ADMIN_EMAIL) throw new Error("ADMIN_EMAIL is required.");
if (!ADMIN_NAME) throw new Error("ADMIN_NAME is required.");
if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD is required.");
if (
  ADMIN_PASSWORD.length < 12 ||
  !/[a-z]/.test(ADMIN_PASSWORD) ||
  !/[A-Z]/.test(ADMIN_PASSWORD) ||
  !/[0-9]/.test(ADMIN_PASSWORD)
) {
  throw new Error("ADMIN_PASSWORD must have at least 12 characters with uppercase, lowercase, and a number.");
}

function deriveScryptKey(password, salt, keyLength, options) {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const parameters = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
  const derived = await deriveScryptKey(password, salt, 64, parameters);
  return ["scrypt", parameters.N, parameters.r, parameters.p, salt, derived.toString("base64url")].join("$");
}

const email = ADMIN_EMAIL.trim().toLowerCase();
const openId = `local_admin_${Buffer.from(email).toString("base64url").slice(0, 44)}`;
const passwordHash = await hashPassword(ADMIN_PASSWORD);
const connection = await mysql.createConnection(DATABASE_URL);

try {
  await connection.beginTransaction();
  await connection.execute(
    `INSERT INTO users
      (openId, name, email, loginMethod, passwordHash, accountStatus, role, invitationAcceptedAt, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, 'password', ?, 'active', 'admin', NOW(), NOW(), NOW(), NOW())
     ON DUPLICATE KEY UPDATE
      openId = VALUES(openId),
      name = VALUES(name),
      loginMethod = 'password',
      passwordHash = VALUES(passwordHash),
      accountStatus = 'active',
      role = 'admin',
      invitationAcceptedAt = COALESCE(invitationAcceptedAt, NOW()),
      updatedAt = NOW()`,
    [openId, ADMIN_NAME.trim(), email, passwordHash]
  );
  const [rows] = await connection.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  const userId = rows[0]?.id;
  if (!userId) throw new Error("The administrator account could not be resolved after creation.");

  await connection.execute(
    `INSERT INTO memberships
      (userId, tier, status, source, startsAt, createdAt, updatedAt)
     VALUES (?, 'custom', 'active', 'manual', NOW(), NOW(), NOW())
     ON DUPLICATE KEY UPDATE status = 'active', updatedAt = NOW()`,
    [userId]
  );
  await connection.commit();
  console.log(`Administrator ready: ${email}`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}

