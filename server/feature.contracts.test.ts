import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

const adminRouter = read("server/routers/admin.ts");
const adminData = read("server/adminData.ts");
const memberRouter = read("server/routers/member.ts");
const memberData = read("server/memberData.ts");
const adminMedia = read("server/routes/adminMedia.ts");
const memberMedia = read("server/routes/memberMedia.ts");
const sso = read("server/sso.ts");
const ssoRoute = read("server/routes/sso.ts");
const qaFixtures = read("server/qaFixtures.ts");

describe("member and content contracts", () => {
  it("QA-MEMBER-AUTHORIZATION-001 protects every member procedure server-side", () => {
    const procedures = memberRouter.match(/protectedProcedure/g) ?? [];
    expect(procedures.length).toBeGreaterThanOrEqual(9);
    expect(memberRouter).not.toContain("publicProcedure");
  });

  it("QA-TEACHINGS-001 validates slugs and returns explicit not-found responses", () => {
    expect(memberRouter).toContain("/^[a-z0-9]+(?:-[a-z0-9]+)*$/");
    expect(memberRouter).toContain('message: "Teaching not found"');
    expect(memberData).toMatch(/eq\(teachings\.status,\s*"published"\)/);
  });

  it("QA-COURSES-PROGRESS-001 bounds completion percentage and playback position", () => {
    expect(memberRouter).toContain("percentComplete: z.number().int().min(0).max(100)");
    expect(memberRouter).toContain("lastPositionSeconds: z.number().int().min(0).max(86_400)");
    expect(memberRouter).toContain('message: "Lesson not found"');
  });

  it("QA-COURSES-PROGRESS-002 keeps progress updates scoped to the authenticated user", () => {
    expect(memberRouter).toContain("updateLessonProgress({ userId: ctx.user.id, ...input })");
    expect(memberData).toContain("userId: input.userId");
  });
});

describe("administrator workflow contracts", () => {
  it("QA-ADMIN-MEMBERS-001 validates email, role-safe state, tier, status, and notes at the router boundary", () => {
    expect(adminRouter).toContain("email: z.string().trim().email().max(320)");
    expect(adminRouter).toContain('z.enum(["invited", "active", "suspended"])');
    expect(adminRouter).toContain('z.enum(["pending", "active", "paused", "cancelled", "expired"])');
    expect(adminRouter).toContain("internalNotes: z.string().max(4000)");
  });

  it("QA-ADMIN-MEMBERS-002 creates a member, membership, invitation, and audit record in one transaction", () => {
    expect(adminData).toContain("const created = await db.transaction(async tx =>");
    expect(adminData).toContain("await tx.insert(users).values");
    expect(adminData).toContain("await tx.insert(memberships).values");
    expect(adminData).toContain("await tx.insert(invitationTokens).values");
    expect(adminData).toContain("await tx.insert(auditLogs).values");
  });

  it("QA-ADMIN-MEMBERS-003 blocks member controls from changing administrator access", () => {
    expect(adminData).toContain('if (targetRows[0].role === "admin")');
    expect(adminData).toContain("Administrator access cannot be changed from the member controls.");
  });

  it("QA-ADMIN-TEACHINGS-001 bounds editorial content and publication inputs", () => {
    expect(adminRouter).toContain("title: z.string().trim().min(1).max(240)");
    expect(adminRouter).toContain("body: z.string().max(100000)");
    expect(adminRouter).toContain('z.enum(["draft", "published", "archived"])');
  });

  it("QA-ADMIN-COURSES-001 enforces positive IDs and deterministic sort-order bounds", () => {
    expect(adminRouter).toContain("courseId: z.number().int().positive()");
    expect(adminRouter).toContain("sectionId: z.number().int().positive().nullable().optional()");
    expect((adminRouter.match(/sortOrder: z\.number\(\)\.int\(\)\.min\(0\)\.max\(10000\)/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });
});

describe("media, invitation, SSO, and production-safety contracts", () => {
  it("QA-ADMIN-MEDIA-001 requires administrator authorization before upload processing", () => {
    expect(adminMedia).toContain("authenticateMemberRequest");
    expect(adminMedia).toContain('auth.user.role !== "admin"');
    expect(adminMedia).toContain('auth.user.accountStatus === "suspended"');
    expect(adminMedia).toMatch(/multer|upload/);
  });

  it("QA-PROTECTED-MEDIA-001 validates protected keys and forwards byte ranges", () => {
    expect(memberMedia).toContain("decodeStorageKey");
    expect(memberMedia).toMatch(/range/i);
    expect(memberMedia).toMatch(/401|403/);
  });

  it("QA-INVITATION-PASSWORD-005 stores only the invitation hash and returns the raw token only in the invitation URL", () => {
    expect(adminData).toContain("tokenHash: sha256(rawToken)");
    expect(adminData).toContain("/accept-invitation?token=");
    expect(adminData).not.toMatch(/password\s*:/i);
  });

  it("QA-APPS-SSO-001 keeps SSO disabled until confidential configuration is complete", () => {
    expect(sso).toContain("enabled");
    expect(sso).toMatch(/secret|SECRET/);
    expect(memberRouter).toContain('code: "PRECONDITION_FAILED"');
    expect(ssoRoute).toMatch(/timingSafeEqual|consume|exchange/i);
  });

  it("QA-SECURITY-PRIVACY-001 prohibits development QA fixtures in production", () => {
    expect(qaFixtures).toContain('process.env.NODE_ENV === "development"');
    expect(qaFixtures).toContain("if (mediaId !== QA_MEDIA_ID || !isDevelopmentQaRequest()) return null");
  });
});
