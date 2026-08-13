import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { MEMBER_SESSION_COOKIE } from "./auth";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const now = new Date();

  const ctx: TrpcContext = {
    user: {
      id: 1,
      openId: "local_test_user",
      email: "member@example.com",
      name: "Portal Member",
      loginMethod: "password",
      passwordHash: null,
      accountStatus: "active",
      role: "user",
      invitationAcceptedAt: now,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    membership: null,
    sessionTokenHash: null,
    authMethod: "member",
    req: {
      protocol: "https",
      secure: true,
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears both the first-party and preview compatibility cookies", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.auth.logout()).resolves.toEqual({ success: true });
    expect(clearedCookies.map(call => call.name)).toEqual([
      MEMBER_SESSION_COOKIE,
      COOKIE_NAME,
    ]);
    expect(clearedCookies[0]?.options).toMatchObject({
      secure: true,
      sameSite: "lax",
      httpOnly: true,
      path: "/",
    });
    expect(clearedCookies[0]?.options).not.toHaveProperty("maxAge");
  });
});
