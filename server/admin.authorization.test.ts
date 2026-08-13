import { describe, expect, it } from "vitest";
import type { Membership, User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const now = new Date("2026-08-13T12:00:00.000Z");

function user(role: "user" | "admin" = "user"): User {
  return {
    id: 31,
    openId: `local_${role}`,
    name: role === "admin" ? "Administrator" : "Active Member",
    email: `${role}@example.com`,
    loginMethod: "password",
    passwordHash: null,
    accountStatus: "active",
    role,
    invitationAcceptedAt: now,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

function membership(): Membership {
  return {
    id: 31,
    userId: 31,
    tier: "gold",
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
}

function context(currentUser: User | null): TrpcContext {
  return {
    user: currentUser,
    membership: currentUser?.role === "user" ? membership() : null,
    sessionTokenHash: currentUser ? "session-hash" : null,
    authMethod: currentUser ? "member" : null,
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("administrator procedure authorization", () => {
  it("rejects signed-out requests across management areas", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.admin.overview()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.admin.members.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.admin.teachings.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.admin.courses.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.admin.media.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a fully active paying member who is not an administrator", async () => {
    const caller = appRouter.createCaller(context(user("user")));
    await expect(caller.admin.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.admin.members.create({
        name: "New Member",
        email: "new@example.com",
        tier: "silver",
        membershipStatus: "active",
        endsAt: null,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.admin.teachings.save({
        title: "Private Teaching",
        contentType: "text",
        status: "draft",
        featured: false,
        sortOrder: 0,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.admin.courses.save({
        title: "Private Course",
        status: "draft",
        sortOrder: 0,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

