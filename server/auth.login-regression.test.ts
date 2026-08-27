import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../drizzle/schema";

const dbMocks = vi.hoisted(() => ({
  createMemberSession: vi.fn(),
  getMembershipByUserId: vi.fn(),
  getSessionWithUserByTokenHash: vi.fn(),
  getUserByEmail: vi.fn(),
  recordMemberActivity: vi.fn(),
  revokeMemberSessionByTokenHash: vi.fn(),
  touchMemberSession: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import {
  authenticateEmailAndPassword,
  hashPassword,
  memberCookieOptions,
  verifyPassword,
} from "./auth";

const now = new Date("2026-08-26T12:00:00.000Z");

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    openId: "local_login_regression_user",
    name: "Login Regression Member",
    email: "member@example.com",
    loginMethod: "password",
    passwordHash: null,
    accountStatus: "active",
    role: "user",
    invitationAcceptedAt: now,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    ...overrides,
  };
}

describe("P0 login regression contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("QA-LOGIN-CREDENTIALS-001 authenticates a normalized email with the correct stored scrypt password", async () => {
    const password = "Correct-Horse-Battery-7";
    const user = makeUser({ passwordHash: await hashPassword(password) });
    dbMocks.getUserByEmail.mockResolvedValue(user);

    await expect(authenticateEmailAndPassword("  MEMBER@Example.COM  ", password)).resolves.toEqual(user);
    expect(dbMocks.getUserByEmail).toHaveBeenCalledWith("member@example.com");
  });

  it("QA-LOGIN-CREDENTIALS-002 rejects a wrong password without returning a partial identity", async () => {
    const user = makeUser({ passwordHash: await hashPassword("Correct-Horse-Battery-7") });
    dbMocks.getUserByEmail.mockResolvedValue(user);

    await expect(authenticateEmailAndPassword(user.email!, "Wrong-Horse-Battery-8")).resolves.toBeNull();
  });

  it("QA-LOGIN-CREDENTIALS-003 rejects an account that has no password hash", async () => {
    dbMocks.getUserByEmail.mockResolvedValue(makeUser({ passwordHash: null }));

    await expect(
      authenticateEmailAndPassword("member@example.com", "Correct-Horse-Battery-7")
    ).resolves.toBeNull();
  });

  it("QA-LOGIN-CREDENTIALS-004 rejects a suspended account even when its password is correct", async () => {
    const password = "Correct-Horse-Battery-7";
    dbMocks.getUserByEmail.mockResolvedValue(
      makeUser({ accountStatus: "suspended", passwordHash: await hashPassword(password) })
    );

    await expect(authenticateEmailAndPassword("member@example.com", password)).resolves.toBeNull();
  });

  it("QA-LOGIN-CREDENTIALS-005 fails closed for malformed or truncated encoded password hashes", async () => {
    await expect(verifyPassword("Correct-Horse-Battery-7", "scrypt$16384$8$1$missing")).resolves.toBe(false);
    await expect(verifyPassword("Correct-Horse-Battery-7", "bcrypt$not-supported")).resolves.toBe(false);
  });

  it("QA-SESSION-SECURITY-001 applies Secure, HttpOnly, SameSite=Lax session-cookie protections", () => {
    const options = memberCookieOptions({
      protocol: "https",
      secure: true,
      headers: {},
    } as any);

    expect(options).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    expect(options.maxAge).toBeGreaterThan(0);
  });
});
