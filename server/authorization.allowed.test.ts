import { describe, expect, it, vi } from "vitest";
import type { Membership, User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

vi.mock("./memberData", () => ({
  getMemberDashboard: vi.fn().mockResolvedValue({
    recentActivity: [],
    progress: { totalLessons: 0, completedLessons: 0, percent: 0 },
    continueLearning: null,
  }),
  getProtectedMediaUrl: vi.fn().mockResolvedValue({ key: "media/test", url: "/media/test" }),
  getPublishedCourse: vi.fn().mockResolvedValue({ course: { id: 1 }, sections: [], lessons: [], progress: { total: 0, completed: 0, percent: 0 } }),
  getPublishedTeaching: vi.fn().mockResolvedValue({ teaching: { id: 1 }, category: null, assets: [] }),
  listPublishedCourses: vi.fn().mockResolvedValue([]),
  listPublishedTeachings: vi.fn().mockResolvedValue([]),
  listTeachingCategories: vi.fn().mockResolvedValue([]),
  updateLessonProgress: vi.fn().mockResolvedValue({ course: { id: 1 }, sections: [], lessons: [], progress: { total: 0, completed: 0, percent: 0 } }),
}));

vi.mock("./sso", () => ({
  appKeys: ["elevate", "enlightened_body", "tao"] as const,
  listIntegrationStatus: vi.fn().mockReturnValue([
    { key: "elevate", title: "Elevate To Love", eyebrow: "Guidance", description: "", enabled: true },
  ]),
  createSsoLaunch: vi.fn().mockResolvedValue({
    launchUrl: "https://example.com/sso/callback?code=one-time",
    expiresAt: new Date("2026-08-13T12:01:30.000Z"),
  }),
}));

vi.mock("./adminData", () => ({
  createInvitedMember: vi.fn().mockResolvedValue({ member: { id: 2 }, invitationUrl: "https://example.com/invite", expiresAt: new Date() }),
  getAdminCourseStructure: vi.fn().mockResolvedValue({ course: { id: 1 }, sections: [], lessons: [] }),
  getAdminOverview: vi.fn().mockResolvedValue({ members: 0, activeMembers: 0, publishedTeachings: 0, publishedCourses: 0, mediaAssets: 0 }),
  listAdminCategories: vi.fn().mockResolvedValue([]),
  listAdminCourses: vi.fn().mockResolvedValue([]),
  listAdminMedia: vi.fn().mockResolvedValue([]),
  listAdminMembers: vi.fn().mockResolvedValue([]),
  listAdminTeachings: vi.fn().mockResolvedValue([]),
  refreshMemberInvitation: vi.fn().mockResolvedValue({ invitationUrl: "https://example.com/invite", expiresAt: new Date() }),
  saveCategory: vi.fn().mockResolvedValue(undefined),
  saveCourse: vi.fn().mockResolvedValue(1),
  saveCourseLesson: vi.fn().mockResolvedValue(undefined),
  saveCourseSection: vi.fn().mockResolvedValue(undefined),
  saveTeaching: vi.fn().mockResolvedValue(1),
  updateMemberAccess: vi.fn().mockResolvedValue(undefined),
}));

import { appRouter } from "./routers";

const now = new Date("2026-08-13T12:00:00.000Z");

function makeUser(role: "user" | "admin"): User {
  return {
    id: role === "admin" ? 1 : 2,
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

function makeMembership(): Membership {
  return {
    id: 2,
    userId: 2,
    tier: "gold",
    status: "active",
    source: "manual",
    startsAt: new Date("2026-01-01T00:00:00.000Z"),
    endsAt: new Date("2027-01-01T00:00:00.000Z"),
    graceEndsAt: null,
    externalCustomerId: null,
    externalSubscriptionId: null,
    externalProductId: null,
    internalNotes: null,
    createdAt: now,
    updatedAt: now,
  };
}

function context(currentUser: User, membership: Membership | null): TrpcContext {
  return {
    user: currentUser,
    membership,
    sessionTokenHash: "session-hash",
    authMethod: "member",
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("allowed authorization paths", () => {
  it("allows an active member through each protected member router", async () => {
    const caller = appRouter.createCaller(context(makeUser("user"), makeMembership()));
    await expect(caller.member.dashboard()).resolves.toMatchObject({ progress: { percent: 0 } });
    await expect(caller.member.teachings.categories()).resolves.toEqual([]);
    await expect(caller.member.teachings.list()).resolves.toEqual([]);
    await expect(caller.member.courses.list()).resolves.toEqual([]);
    await expect(caller.member.media.url({ mediaId: 1 })).resolves.toMatchObject({ url: "/media/test" });
    await expect(caller.member.apps.list()).resolves.toHaveLength(1);
    await expect(caller.member.apps.launch({ appKey: "elevate" })).resolves.toMatchObject({ launchUrl: expect.stringContaining("code=") });
  });

  it("allows an active administrator through each management router", async () => {
    const caller = appRouter.createCaller(context(makeUser("admin"), null));
    await expect(caller.admin.overview()).resolves.toMatchObject({ activeMembers: 0 });
    await expect(caller.admin.members.list()).resolves.toEqual([]);
    await expect(caller.admin.categories.list()).resolves.toEqual([]);
    await expect(caller.admin.teachings.list()).resolves.toEqual([]);
    await expect(caller.admin.courses.list()).resolves.toEqual([]);
    await expect(caller.admin.media.list()).resolves.toEqual([]);
  });
});
