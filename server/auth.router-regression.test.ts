import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Membership, User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

const authMocks = vi.hoisted(() => ({
  authenticateEmailAndPassword: vi.fn(),
  hashPassword: vi.fn(),
  issueMemberSession: vi.fn(),
  revokeCurrentMemberSession: vi.fn(),
  sha256: vi.fn(),
}));

const dbMocks = vi.hoisted(() => ({
  acceptInvitationByTokenHash: vi.fn(),
  getInvitationByTokenHash: vi.fn(),
  getMembershipByUserId: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("./auth", async importOriginal => {
  const original = await importOriginal<typeof import("./auth")>();
  return { ...original, ...authMocks };
});

vi.mock("./db", async importOriginal => {
  const original = await importOriginal<typeof import("./db")>();
  return { ...original, ...dbMocks };
});

import { MEMBER_SESSION_COOKIE } from "./auth";
import { appRouter } from "./routers";

const now = new Date("2026-08-26T12:00:00.000Z");
const user: User = {
  id: 9,
  openId: "local_router_user",
  name: "Portal Member",
  email: "member@example.com",
  loginMethod: "password",
  passwordHash: "scrypt$test",
  accountStatus: "active",
  role: "user",
  invitationAcceptedAt: now,
  createdAt: now,
  updatedAt: now,
  lastSignedIn: now,
};
const membership: Membership = {
  id: 3,
  userId: user.id,
  tier: "custom",
  status: "active",
  source: "manual",
  startsAt: now,
  endsAt: null,
  graceEndsAt: null,
  externalCustomerId: null,
  externalSubscriptionId: null,
  externalProductId: null,
  internalNotes: null,
  createdAt: now,
  updatedAt: now,
};

function createContext() {
  const cookie = vi.fn();
  const clearCookie = vi.fn();
  const ctx = {
    user: null,
    membership: null,
    sessionTokenHash: null,
    authMethod: "none",
    req: { protocol: "https", secure: true, headers: {} },
    res: { cookie, clearCookie },
  } as unknown as TrpcContext;
  return { ctx, cookie, clearCookie };
}

describe("P0 auth router regression contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.sha256.mockImplementation((value: string) => `hash:${value}`);
    authMocks.hashPassword.mockResolvedValue("scrypt$derived-password-hash");
    authMocks.issueMemberSession.mockResolvedValue({ token: "opaque-session", tokenHash: "opaque-hash" });
    dbMocks.getMembershipByUserId.mockResolvedValue(membership);
  });

  it("QA-LOGIN-CREDENTIALS-006 issues the hardened member cookie after valid credentials", async () => {
    authMocks.authenticateEmailAndPassword.mockResolvedValue(user);
    const { ctx, cookie } = createContext();

    const viewer = await appRouter.createCaller(ctx).auth.login({
      email: "member@example.com",
      password: "Valid-Password-123",
    });

    expect(viewer).toMatchObject({ id: user.id, email: user.email, role: "user" });
    expect(authMocks.issueMemberSession).toHaveBeenCalledWith(user, ctx.req);
    expect(cookie).toHaveBeenCalledWith(
      MEMBER_SESSION_COOKIE,
      "opaque-session",
      expect.objectContaining({ secure: true, httpOnly: true, sameSite: "lax", path: "/" })
    );
  });

  it("QA-LOGIN-VALIDATION-002 returns the same generic unauthorized response for rejected credentials", async () => {
    authMocks.authenticateEmailAndPassword.mockResolvedValue(null);
    const { ctx, cookie } = createContext();

    await expect(
      appRouter.createCaller(ctx).auth.login({
        email: "missing@example.com",
        password: "Wrong-Password-123",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED", message: "The email or password was not recognized." });
    expect(cookie).not.toHaveBeenCalled();
  });

  it("QA-INVITATION-PASSWORD-001 reports an invalid token without leaking an account identity", async () => {
    dbMocks.getInvitationByTokenHash.mockResolvedValue(null);
    const { ctx } = createContext();
    const token = "a".repeat(32);

    await expect(appRouter.createCaller(ctx).auth.invitation({ token })).resolves.toEqual({ valid: false });
    expect(authMocks.sha256).toHaveBeenCalledWith(token);
  });

  it("QA-INVITATION-PASSWORD-002 exposes only the intended invitation preview fields", async () => {
    const token = "b".repeat(32);
    dbMocks.getInvitationByTokenHash.mockResolvedValue({
      invitation: { expiresAt: now },
      user,
    });
    const { ctx } = createContext();

    await expect(appRouter.createCaller(ctx).auth.invitation({ token })).resolves.toEqual({
      valid: true,
      name: user.name,
      email: user.email,
      expiresAt: now,
    });
  });

  it("QA-INVITATION-PASSWORD-003 activates the accepted invitation and immediately issues a session", async () => {
    const token = "c".repeat(32);
    dbMocks.acceptInvitationByTokenHash.mockResolvedValue({ user, membership });
    const { ctx, cookie } = createContext();

    const viewer = await appRouter.createCaller(ctx).auth.acceptInvitation({
      token,
      password: "Valid-Password-123",
    });

    expect(authMocks.hashPassword).toHaveBeenCalledWith("Valid-Password-123");
    expect(dbMocks.acceptInvitationByTokenHash).toHaveBeenCalledWith(
      `hash:${token}`,
      "scrypt$derived-password-hash"
    );
    expect(viewer).toMatchObject({ id: user.id, email: user.email });
    expect(cookie).toHaveBeenCalledWith(MEMBER_SESSION_COOKIE, "opaque-session", expect.any(Object));
  });

  it("QA-INVITATION-PASSWORD-004 rejects an expired or consumed invitation without issuing a session", async () => {
    dbMocks.acceptInvitationByTokenHash.mockResolvedValue(null);
    const { ctx, cookie } = createContext();

    await expect(
      appRouter.createCaller(ctx).auth.acceptInvitation({
        token: "d".repeat(32),
        password: "Valid-Password-123",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "This invitation is invalid or has expired." });
    expect(cookie).not.toHaveBeenCalled();
  });
});
