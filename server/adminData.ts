import { randomBytes } from "crypto";
import { and, asc, count, desc, eq, like, or } from "drizzle-orm";
import {
  auditLogs,
  contentCategories,
  courseLessons,
  courseSections,
  courses,
  invitationTokens,
  mediaAssets,
  memberships,
  teachingAssets,
  teachings,
  users,
} from "../drizzle/schema";
import { createOpaqueToken, normalizeEmail, sha256 } from "./auth";
import { getDb } from "./db";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 240);
}

async function writeAudit(
  db: Awaited<ReturnType<typeof requireDb>>,
  input: {
    actorUserId: number;
    action: string;
    targetType: string;
    targetId?: string;
    summary: string;
    metadata?: Record<string, unknown>;
  }
) {
  await db.insert(auditLogs).values({
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    summary: input.summary,
    metadata: input.metadata ?? null,
  });
}

export async function getAdminOverview() {
  const db = await requireDb();
  const [memberRows, activeRows, teachingRows, courseRows, mediaRows] = await Promise.all([
    db.select({ value: count() }).from(users).where(eq(users.role, "user")),
    db.select({ value: count() }).from(memberships).where(eq(memberships.status, "active")),
    db.select({ value: count() }).from(teachings).where(eq(teachings.status, "published")),
    db.select({ value: count() }).from(courses).where(eq(courses.status, "published")),
    db.select({ value: count() }).from(mediaAssets),
  ]);
  return {
    members: memberRows[0]?.value ?? 0,
    activeMembers: activeRows[0]?.value ?? 0,
    publishedTeachings: teachingRows[0]?.value ?? 0,
    publishedCourses: courseRows[0]?.value ?? 0,
    mediaAssets: mediaRows[0]?.value ?? 0,
  };
}

export async function listAdminMembers(search?: string) {
  const db = await requireDb();
  const query = db
    .select({ user: users, membership: memberships })
    .from(users)
    .leftJoin(memberships, eq(users.id, memberships.userId));
  const normalized = search?.trim();
  return normalized
    ? query
        .where(
          or(
            like(users.name, `%${normalized}%`),
            like(users.email, `%${normalized}%`)
          )
        )
        .orderBy(desc(users.createdAt))
    : query.orderBy(desc(users.createdAt));
}

export async function createInvitedMember(input: {
  actorUserId: number;
  name: string;
  email: string;
  tier: "silver" | "gold" | "platinum" | "custom";
  membershipStatus: "pending" | "active";
  endsAt?: Date | null;
}) {
  const db = await requireDb();
  const email = normalizeEmail(input.email);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) throw new Error("A member with this email already exists.");

  const rawToken = createOpaqueToken();
  const invitationTtlHours = Math.max(1, Number(process.env.INVITATION_TTL_HOURS || 72));
  const expiresAt = new Date(Date.now() + invitationTtlHours * 60 * 60 * 1000);
  const openId = `local_${randomBytes(20).toString("hex")}`;

  const created = await db.transaction(async tx => {
    await tx.insert(users).values({
      openId,
      name: input.name.trim(),
      email,
      loginMethod: "password",
      accountStatus: "invited",
      role: "user",
    });
    const userRows = await tx.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userRows[0]!;
    await tx.insert(memberships).values({
      userId: user.id,
      tier: input.tier,
      status: input.membershipStatus,
      source: "manual",
      startsAt: input.membershipStatus === "active" ? new Date() : null,
      endsAt: input.endsAt ?? null,
    });
    await tx.insert(invitationTokens).values({
      userId: user.id,
      tokenHash: sha256(rawToken),
      expiresAt,
      createdBy: input.actorUserId,
    });
    await tx.insert(auditLogs).values({
      actorUserId: input.actorUserId,
      action: "member.invited",
      targetType: "user",
      targetId: String(user.id),
      summary: `Invited ${email}`,
      metadata: { tier: input.tier, membershipStatus: input.membershipStatus },
    });
    return user;
  });

  const origin = (process.env.APP_ORIGIN || "http://localhost:3000").replace(/\/$/, "");
  return {
    member: created,
    invitationUrl: `${origin}/accept-invitation?token=${encodeURIComponent(rawToken)}`,
    expiresAt,
  };
}

export async function refreshMemberInvitation(actorUserId: number, userId: number) {
  const db = await requireDb();
  const memberRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const member = memberRows[0];
  if (!member) return null;
  const rawToken = createOpaqueToken();
  const invitationTtlHours = Math.max(1, Number(process.env.INVITATION_TTL_HOURS || 72));
  const expiresAt = new Date(Date.now() + invitationTtlHours * 60 * 60 * 1000);
  await db.insert(invitationTokens).values({
    userId,
    tokenHash: sha256(rawToken),
    expiresAt,
    createdBy: actorUserId,
  });
  await writeAudit(db, {
    actorUserId,
    action: "member.invitation_refreshed",
    targetType: "user",
    targetId: String(userId),
    summary: `Created a new invitation for ${member.email || userId}`,
  });
  const origin = (process.env.APP_ORIGIN || "http://localhost:3000").replace(/\/$/, "");
  return { invitationUrl: `${origin}/accept-invitation?token=${encodeURIComponent(rawToken)}`, expiresAt };
}

export async function updateMemberAccess(input: {
  actorUserId: number;
  userId: number;
  accountStatus: "invited" | "active" | "suspended";
  tier: "silver" | "gold" | "platinum" | "custom";
  membershipStatus: "pending" | "active" | "paused" | "cancelled" | "expired";
  endsAt?: Date | null;
  internalNotes?: string | null;
}) {
  const db = await requireDb();
  const targetRows = await db.select({ role: users.role }).from(users).where(eq(users.id, input.userId)).limit(1);
  if (!targetRows[0]) throw new Error("Member not found.");
  if (targetRows[0].role === "admin") {
    throw new Error("Administrator access cannot be changed from the member controls.");
  }
  await db.transaction(async tx => {
    await tx.update(users).set({ accountStatus: input.accountStatus }).where(eq(users.id, input.userId));
    await tx
      .insert(memberships)
      .values({
        userId: input.userId,
        tier: input.tier,
        status: input.membershipStatus,
        source: "manual",
        startsAt: input.membershipStatus === "active" ? new Date() : null,
        endsAt: input.endsAt ?? null,
        internalNotes: input.internalNotes ?? null,
      })
      .onDuplicateKeyUpdate({
        set: {
          tier: input.tier,
          status: input.membershipStatus,
          endsAt: input.endsAt ?? null,
          internalNotes: input.internalNotes ?? null,
        },
      });
    await tx.insert(auditLogs).values({
      actorUserId: input.actorUserId,
      action: "member.access_updated",
      targetType: "user",
      targetId: String(input.userId),
      summary: `Updated membership access for user ${input.userId}`,
      metadata: {
        accountStatus: input.accountStatus,
        tier: input.tier,
        membershipStatus: input.membershipStatus,
      },
    });
  });
}

export async function listAdminCategories() {
  const db = await requireDb();
  return db.select().from(contentCategories).orderBy(asc(contentCategories.sortOrder), asc(contentCategories.name));
}

export async function saveCategory(input: {
  actorUserId: number;
  id?: number;
  name: string;
  description?: string | null;
  sortOrder: number;
}) {
  const db = await requireDb();
  const values = {
    name: input.name.trim(),
    slug: slugify(input.name),
    description: input.description?.trim() || null,
    sortOrder: input.sortOrder,
  };
  if (input.id) await db.update(contentCategories).set(values).where(eq(contentCategories.id, input.id));
  else await db.insert(contentCategories).values(values);
  await writeAudit(db, {
    actorUserId: input.actorUserId,
    action: input.id ? "category.updated" : "category.created",
    targetType: "content_category",
    targetId: input.id ? String(input.id) : undefined,
    summary: `${input.id ? "Updated" : "Created"} category ${values.name}`,
  });
}

export async function listAdminMedia() {
  const db = await requireDb();
  return db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
}

export async function listAdminTeachings() {
  const db = await requireDb();
  return db
    .select({ teaching: teachings, category: contentCategories })
    .from(teachings)
    .leftJoin(contentCategories, eq(teachings.categoryId, contentCategories.id))
    .orderBy(desc(teachings.updatedAt));
}

export async function saveTeaching(input: {
  actorUserId: number;
  id?: number;
  categoryId?: number | null;
  title: string;
  summary?: string | null;
  body?: string | null;
  contentType: "video" | "audio" | "image" | "text" | "mixed";
  status: "draft" | "published" | "archived";
  featured: boolean;
  sortOrder: number;
  mediaAssetId?: number | null;
}) {
  const db = await requireDb();
  const values = {
    categoryId: input.categoryId ?? null,
    title: input.title.trim(),
    slug: slugify(input.title),
    summary: input.summary?.trim() || null,
    body: input.body?.trim() || null,
    contentType: input.contentType,
    status: input.status,
    featured: input.featured,
    sortOrder: input.sortOrder,
    publishedAt: input.status === "published" ? new Date() : null,
    createdBy: input.actorUserId,
  };

  let teachingId = input.id;
  await db.transaction(async tx => {
    if (teachingId) {
      await tx.update(teachings).set(values).where(eq(teachings.id, teachingId));
    } else {
      await tx.insert(teachings).values(values);
      const rows = await tx.select({ id: teachings.id }).from(teachings).where(eq(teachings.slug, values.slug)).limit(1);
      teachingId = rows[0]!.id;
    }
    if (input.mediaAssetId) {
      await tx.delete(teachingAssets).where(and(eq(teachingAssets.teachingId, teachingId!), eq(teachingAssets.usage, "primary")));
      await tx.insert(teachingAssets).values({ teachingId: teachingId!, mediaAssetId: input.mediaAssetId, usage: "primary" });
    }
    await tx.insert(auditLogs).values({
      actorUserId: input.actorUserId,
      action: input.id ? "teaching.updated" : "teaching.created",
      targetType: "teaching",
      targetId: String(teachingId),
      summary: `${input.id ? "Updated" : "Created"} teaching ${values.title}`,
    });
  });
  return teachingId!;
}

export async function listAdminCourses() {
  const db = await requireDb();
  return db
    .select({ course: courses, lessonCount: count(courseLessons.id) })
    .from(courses)
    .leftJoin(courseLessons, eq(courses.id, courseLessons.courseId))
    .groupBy(courses.id)
    .orderBy(desc(courses.updatedAt));
}

export async function saveCourse(input: {
  actorUserId: number;
  id?: number;
  title: string;
  summary?: string | null;
  description?: string | null;
  status: "draft" | "published" | "archived";
  estimatedMinutes?: number | null;
  sortOrder: number;
  coverAssetId?: number | null;
}) {
  const db = await requireDb();
  const values = {
    title: input.title.trim(),
    slug: slugify(input.title),
    summary: input.summary?.trim() || null,
    description: input.description?.trim() || null,
    status: input.status,
    estimatedMinutes: input.estimatedMinutes ?? null,
    sortOrder: input.sortOrder,
    coverAssetId: input.coverAssetId ?? null,
    publishedAt: input.status === "published" ? new Date() : null,
    createdBy: input.actorUserId,
  };
  let courseId = input.id;
  if (courseId) await db.update(courses).set(values).where(eq(courses.id, courseId));
  else {
    await db.insert(courses).values(values);
    const rows = await db.select({ id: courses.id }).from(courses).where(eq(courses.slug, values.slug)).limit(1);
    courseId = rows[0]!.id;
  }
  await writeAudit(db, {
    actorUserId: input.actorUserId,
    action: input.id ? "course.updated" : "course.created",
    targetType: "course",
    targetId: String(courseId),
    summary: `${input.id ? "Updated" : "Created"} course ${values.title}`,
  });
  return courseId!;
}

export async function getAdminCourseStructure(courseId: number) {
  const db = await requireDb();
  const [courseRows, sections, lessons] = await Promise.all([
    db.select().from(courses).where(eq(courses.id, courseId)).limit(1),
    db.select().from(courseSections).where(eq(courseSections.courseId, courseId)).orderBy(asc(courseSections.sortOrder)),
    db.select().from(courseLessons).where(eq(courseLessons.courseId, courseId)).orderBy(asc(courseLessons.sortOrder)),
  ]);
  return courseRows[0] ? { course: courseRows[0], sections, lessons } : null;
}

export async function saveCourseSection(input: {
  actorUserId: number;
  id?: number;
  courseId: number;
  title: string;
  description?: string | null;
  sortOrder: number;
}) {
  const db = await requireDb();
  const values = {
    courseId: input.courseId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    sortOrder: input.sortOrder,
  };
  if (input.id) await db.update(courseSections).set(values).where(eq(courseSections.id, input.id));
  else await db.insert(courseSections).values(values);
  await writeAudit(db, {
    actorUserId: input.actorUserId,
    action: input.id ? "course_section.updated" : "course_section.created",
    targetType: "course_section",
    targetId: input.id ? String(input.id) : undefined,
    summary: `${input.id ? "Updated" : "Created"} course section ${values.title}`,
  });
}

export async function saveCourseLesson(input: {
  actorUserId: number;
  id?: number;
  courseId: number;
  sectionId?: number | null;
  title: string;
  summary?: string | null;
  body?: string | null;
  contentType: "video" | "audio" | "image" | "text" | "mixed";
  mediaAssetId?: number | null;
  status: "draft" | "published" | "archived";
  estimatedMinutes?: number | null;
  sortOrder: number;
}) {
  const db = await requireDb();
  const values = {
    courseId: input.courseId,
    sectionId: input.sectionId ?? null,
    title: input.title.trim(),
    slug: slugify(input.title),
    summary: input.summary?.trim() || null,
    body: input.body?.trim() || null,
    contentType: input.contentType,
    mediaAssetId: input.mediaAssetId ?? null,
    status: input.status,
    estimatedMinutes: input.estimatedMinutes ?? null,
    sortOrder: input.sortOrder,
  };
  if (input.id) await db.update(courseLessons).set(values).where(eq(courseLessons.id, input.id));
  else await db.insert(courseLessons).values(values);
  await writeAudit(db, {
    actorUserId: input.actorUserId,
    action: input.id ? "lesson.updated" : "lesson.created",
    targetType: "course_lesson",
    targetId: input.id ? String(input.id) : undefined,
    summary: `${input.id ? "Updated" : "Created"} lesson ${values.title}`,
  });
}

export async function registerMediaAsset(input: {
  actorUserId: number;
  kind: "video" | "audio" | "image" | "document";
  storageKey: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
  altText?: string | null;
}) {
  const db = await requireDb();
  await db.insert(mediaAssets).values({
    kind: input.kind,
    storageKey: input.storageKey,
    originalName: input.originalName,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    altText: input.altText ?? null,
    createdBy: input.actorUserId,
  });
  const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.storageKey, input.storageKey)).limit(1);
  const asset = rows[0]!;
  await writeAudit(db, {
    actorUserId: input.actorUserId,
    action: "media.uploaded",
    targetType: "media_asset",
    targetId: String(asset.id),
    summary: `Uploaded ${input.originalName}`,
  });
  return asset;
}
