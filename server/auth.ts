import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import type { Request } from "express";
import type { Membership, User } from "../drizzle/schema";
import {
  createMemberSession,
  getMembershipByUserId,
  getSessionWithUserByTokenHash,
  getUserByEmail,
  revokeMemberSessionByTokenHash,
  touchMemberSession,
} from "./db";

const SESSION_TOKEN_BYTES = 32;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export const MEMBER_SESSION_COOKIE =
  process.env.SESSION_COOKIE_NAME || "susan_membership_session";

export type AuthenticatedMember = {
  user: User;
  membership: Membership | null;
  sessionTokenHash: string;
};

function deriveScryptKey(
  password: string,
  salt: string,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number }
) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey as Buffer);
    });
  });
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createOpaqueToken() {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = await deriveScryptKey(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  });

  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt, derived.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, encodedHash: string) {
  const [scheme, rawN, rawR, rawP, salt, expectedEncoded] = encodedHash.split("$");
  if (scheme !== "scrypt" || !rawN || !rawR || !rawP || !salt || !expectedEncoded) {
    return false;
  }

  const expected = Buffer.from(expectedEncoded, "base64url");
  const derived = await deriveScryptKey(password, salt, expected.length, {
    N: Number(rawN),
    r: Number(rawR),
    p: Number(rawP),
    maxmem: 64 * 1024 * 1024,
  });

  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function parseCookieHeader(header: string | undefined) {
  const values = new Map<string, string>();
  if (!header) return values;

  for (const pair of header.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (name) values.set(name, decodeURIComponent(value));
  }

  return values;
}

export function readMemberSessionToken(req: Request) {
  return parseCookieHeader(req.headers.cookie).get(MEMBER_SESSION_COOKIE) ?? null;
}

export function getClientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return value?.trim() || req.ip || req.socket.remoteAddress || "unknown";
}

export function isSecureRequest(req: Request) {
  if (req.secure) return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const value = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  return value?.split(",")[0]?.trim() === "https";
}

export function memberCookieOptions(req: Request) {
  const ttlDays = Math.max(1, Number(process.env.SESSION_TTL_DAYS || 30));
  return {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: "lax" as const,
    path: "/",
    maxAge: ttlDays * 24 * 60 * 60 * 1000,
  };
}

export function isMembershipActive(membership: Membership | null, now = new Date()) {
  if (!membership || membership.status !== "active") return false;
  if (membership.startsAt && membership.startsAt > now) return false;
  if (membership.endsAt && membership.endsAt <= now) return false;
  return true;
}

export function canAccessPortal(user: User, membership: Membership | null) {
  if (user.role === "admin") return user.accountStatus !== "suspended";
  return user.accountStatus === "active" && isMembershipActive(membership);
}

export function toViewer(user: User, membership: Membership | null) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    isAdmin: user.role === "admin",
    hasPortalAccess: canAccessPortal(user, membership),
    membership: membership
      ? {
          tier: membership.tier,
          status: membership.status,
          startsAt: membership.startsAt,
          endsAt: membership.endsAt,
          source: membership.source,
        }
      : null,
  };
}

export async function authenticateEmailAndPassword(email: string, password: string) {
  const user = await getUserByEmail(normalizeEmail(email));
  if (!user?.passwordHash || user.accountStatus === "suspended") return null;
  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? user : null;
}

export async function issueMemberSession(user: User, req: Request) {
  const token = createOpaqueToken();
  const tokenHash = sha256(token);
  const ttlDays = Math.max(1, Number(process.env.SESSION_TTL_DAYS || 30));
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await createMemberSession({
    userId: user.id,
    tokenHash,
    expiresAt,
    userAgent: req.headers["user-agent"]?.slice(0, 512) ?? null,
    ipHash: sha256(getClientIp(req)),
  });

  return { token, tokenHash, expiresAt };
}

export async function authenticateMemberRequest(req: Request): Promise<AuthenticatedMember | null> {
  const token = readMemberSessionToken(req);
  if (!token) return null;

  const sessionTokenHash = sha256(token);
  const result = await getSessionWithUserByTokenHash(sessionTokenHash);
  if (!result) return null;

  const membership = await getMembershipByUserId(result.user.id);
  void touchMemberSession(result.session.id).catch(() => undefined);

  return {
    user: result.user,
    membership: membership ?? null,
    sessionTokenHash,
  };
}

export async function revokeCurrentMemberSession(req: Request) {
  const token = readMemberSessionToken(req);
  if (!token) return;
  await revokeMemberSessionByTokenHash(sha256(token));
}

