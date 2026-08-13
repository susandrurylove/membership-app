import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import type { Membership, User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const now = new Date("2026-08-13T12:00:00.000Z");

function makeUser(): User {
  return {
    id: 9,
    openId: "local_inactive_member",
    name: "Inactive Member",
    email: "inactive@example.com",
    loginMethod: "password",
    passwordHash: null,
    accountStatus: "active",
    role: "user",
    invitationAcceptedAt: now,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

function makePausedMembership(): Membership {
  return {
    id: 12,
    userId: 9,
    tier: "silver",
    status: "paused",
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

function makeContext(user: User | null, membership: Membership | null): TrpcContext {
  return {
    user,
    membership,
    sessionTokenHash: user ? "session-hash" : null,
    authMethod: user ? "member" : null,
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

async function expectCode(promise: Promise<unknown>, code: TRPCError["code"]) {
  await expect(promise).rejects.toMatchObject({ code });
}

describe("member feature authorization", () => {
  it("rejects signed-out requests before any feature data is queried", async () => {
    const caller = appRouter.createCaller(makeContext(null, null));
    await expectCode(caller.member.dashboard(), "UNAUTHORIZED");
    await expectCode(caller.member.teachings.list(), "UNAUTHORIZED");
    await expectCode(caller.member.courses.list(), "UNAUTHORIZED");
    await expectCode(caller.member.media.url({ mediaId: 1 }), "UNAUTHORIZED");
    await expectCode(caller.member.apps.list(), "UNAUTHORIZED");
    await expectCode(caller.member.apps.launch({ appKey: "elevate" }), "UNAUTHORIZED");
  });

  it("rejects a signed-in member whose entitlement is paused", async () => {
    const caller = appRouter.createCaller(makeContext(makeUser(), makePausedMembership()));
    await expectCode(caller.member.dashboard(), "FORBIDDEN");
    await expectCode(caller.member.teachings.categories(), "FORBIDDEN");
    await expectCode(caller.member.teachings.bySlug({ slug: "private-teaching" }), "FORBIDDEN");
    await expectCode(caller.member.courses.bySlug({ slug: "private-course" }), "FORBIDDEN");
    await expectCode(
      caller.member.courses.updateProgress({
        lessonId: 1,
        percentComplete: 100,
        lastPositionSeconds: 0,
        completed: true,
      }),
      "FORBIDDEN"
    );
    await expectCode(caller.member.apps.list(), "FORBIDDEN");
    await expectCode(caller.member.apps.launch({ appKey: "tao" }), "FORBIDDEN");
  });
});
