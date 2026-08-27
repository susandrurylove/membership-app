import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import {
  contentCategories,
  courseLessons,
  courseSections,
  courses,
  lessonProgress,
  mediaAssets,
  memberActivities,
  teachingAssets,
  teachings,
} from "../drizzle/schema";
import { getDb } from "./db";
import { storageGet } from "./storage";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

export async function recordMemberActivity(input: {
  userId: number;
  type: "login" | "teaching_viewed" | "lesson_started" | "lesson_completed" | "app_launched";
  entityType?: string;
  entityId?: string;
  titleSnapshot: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await requireDb();
  const recent = await db
    .select({ id: memberActivities.id })
    .from(memberActivities)
    .where(
      and(
        eq(memberActivities.userId, input.userId),
        eq(memberActivities.type, input.type),
        eq(memberActivities.entityType, input.entityType ?? ""),
        eq(memberActivities.entityId, input.entityId ?? "")
      )
    )
    .orderBy(desc(memberActivities.createdAt))
    .limit(1);

  if (!recent[0]) {
    await db.insert(memberActivities).values({
      userId: input.userId,
      type: input.type,
      entityType: input.entityType ?? "",
      entityId: input.entityId ?? "",
      titleSnapshot: input.titleSnapshot,
      metadata: input.metadata ?? null,
    });
  }
}

export async function getMemberDashboard(userId: number) {
  const db = await requireDb();
  const [recentActivity, lessonCountRows, completionCountRows, continueRows] = await Promise.all([
    db
      .select()
      .from(memberActivities)
      .where(eq(memberActivities.userId, userId))
      .orderBy(desc(memberActivities.createdAt))
      .limit(6),
    db
      .select({ value: count() })
      .from(courseLessons)
      .innerJoin(courses, eq(courseLessons.courseId, courses.id))
      .where(and(eq(courses.status, "published"), eq(courseLessons.status, "published"))),
    db
      .select({ value: count() })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.status, "completed"))),
    db
      .select({
        courseSlug: courses.slug,
        courseTitle: courses.title,
        lessonSlug: courseLessons.slug,
        lessonTitle: courseLessons.title,
        percentComplete: lessonProgress.percentComplete,
        updatedAt: lessonProgress.updatedAt,
      })
      .from(lessonProgress)
      .innerJoin(courseLessons, eq(lessonProgress.lessonId, courseLessons.id))
      .innerJoin(courses, eq(lessonProgress.courseId, courses.id))
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.status, "in_progress"),
          eq(courses.status, "published"),
          eq(courseLessons.status, "published")
        )
      )
      .orderBy(desc(lessonProgress.updatedAt))
      .limit(1),
  ]);

  const totalLessons = lessonCountRows[0]?.value ?? 0;
  const completedLessons = completionCountRows[0]?.value ?? 0;

  return {
    recentActivity,
    progress: {
      totalLessons,
      completedLessons,
      percent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    },
    continueLearning: continueRows[0] ?? null,
  };
}

export async function listTeachingCategories() {
  const db = await requireDb();
  return db
    .select({
      id: contentCategories.id,
      name: contentCategories.name,
      slug: contentCategories.slug,
      description: contentCategories.description,
      itemCount: count(teachings.id),
    })
    .from(contentCategories)
    .leftJoin(
      teachings,
      and(eq(teachings.categoryId, contentCategories.id), eq(teachings.status, "published"))
    )
    .groupBy(contentCategories.id)
    .orderBy(asc(contentCategories.sortOrder), asc(contentCategories.name));
}

export async function listPublishedTeachings(categorySlug?: string) {
  const db = await requireDb();
  const conditions = [eq(teachings.status, "published")];
  if (categorySlug) conditions.push(eq(contentCategories.slug, categorySlug));

  return db
    .select({
      id: teachings.id,
      title: teachings.title,
      slug: teachings.slug,
      summary: teachings.summary,
      contentType: teachings.contentType,
      featured: teachings.featured,
      publishedAt: teachings.publishedAt,
      sourcePublishedAt: teachings.sourcePublishedAt,
      sourceType: teachings.sourceType,
      readingMinutes: teachings.readingMinutes,
      medicalDisclaimer: teachings.medicalDisclaimer,
      heroImageUrl: teachings.heroImageUrl,
      keyThemes: teachings.keyThemes,
      categoryName: contentCategories.name,
      categorySlug: contentCategories.slug,
    })
    .from(teachings)
    .leftJoin(contentCategories, eq(teachings.categoryId, contentCategories.id))
    .where(and(...conditions))
    .orderBy(desc(teachings.featured), asc(teachings.sortOrder), desc(teachings.publishedAt));
}

export async function getPublishedTeaching(userId: number, slug: string) {
  const db = await requireDb();
  const rows = await db
    .select({ teaching: teachings, category: contentCategories })
    .from(teachings)
    .leftJoin(contentCategories, eq(teachings.categoryId, contentCategories.id))
    .where(and(eq(teachings.slug, slug), eq(teachings.status, "published")))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const assets = await db
    .select({ asset: mediaAssets, usage: teachingAssets.usage, sortOrder: teachingAssets.sortOrder })
    .from(teachingAssets)
    .innerJoin(mediaAssets, eq(teachingAssets.mediaAssetId, mediaAssets.id))
    .where(eq(teachingAssets.teachingId, row.teaching.id))
    .orderBy(asc(teachingAssets.sortOrder));

  await recordMemberActivity({
    userId,
    type: "teaching_viewed",
    entityType: "teaching",
    entityId: String(row.teaching.id),
    titleSnapshot: row.teaching.title,
  });

  return { ...row, assets };
}

export function calculateCourseProgress(total: number, completed: number) {
  return {
    total,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

async function getCourseProgress(userId: number, courseId: number) {
  const db = await requireDb();
  const [lessonRows, progressRows] = await Promise.all([
    db
      .select({ id: courseLessons.id })
      .from(courseLessons)
      .where(and(eq(courseLessons.courseId, courseId), eq(courseLessons.status, "published"))),
    db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, courseId))),
  ]);

  const total = lessonRows.length;
  const completed = progressRows.filter(item => item.status === "completed").length;
  return calculateCourseProgress(total, completed);
}

export async function listPublishedCourses(userId: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(courses)
    .where(eq(courses.status, "published"))
    .orderBy(asc(courses.sortOrder), desc(courses.publishedAt));

  return Promise.all(
    rows.map(async course => ({
      ...course,
      progress: await getCourseProgress(userId, course.id),
    }))
  );
}

export async function getPublishedCourse(userId: number, slug: string) {
  const db = await requireDb();
  const courseRows = await db
    .select()
    .from(courses)
    .where(and(eq(courses.slug, slug), eq(courses.status, "published")))
    .limit(1);
  const course = courseRows[0];
  if (!course) return null;

  const [sections, lessons, progress] = await Promise.all([
    db
      .select()
      .from(courseSections)
      .where(eq(courseSections.courseId, course.id))
      .orderBy(asc(courseSections.sortOrder)),
    db
      .select({ lesson: courseLessons, media: mediaAssets })
      .from(courseLessons)
      .leftJoin(mediaAssets, eq(courseLessons.mediaAssetId, mediaAssets.id))
      .where(and(eq(courseLessons.courseId, course.id), eq(courseLessons.status, "published")))
      .orderBy(asc(courseLessons.sortOrder)),
    db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, course.id))),
  ]);

  const progressByLesson = new Map(progress.map(item => [item.lessonId, item]));
  return {
    course,
    sections,
    lessons: lessons.map(item => ({
      ...item,
      progress: progressByLesson.get(item.lesson.id) ?? null,
    })),
    progress: await getCourseProgress(userId, course.id),
  };
}

export async function updateLessonProgress(input: {
  userId: number;
  lessonId: number;
  percentComplete: number;
  lastPositionSeconds: number;
  completed: boolean;
}) {
  const db = await requireDb();
  const rows = await db
    .select({ lesson: courseLessons, course: courses })
    .from(courseLessons)
    .innerJoin(courses, eq(courseLessons.courseId, courses.id))
    .where(
      and(
        eq(courseLessons.id, input.lessonId),
        eq(courseLessons.status, "published"),
        eq(courses.status, "published")
      )
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const existingRows = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, input.userId), eq(lessonProgress.lessonId, input.lessonId)))
    .limit(1);
  const existing = existingRows[0];
  const now = new Date();
  const status = input.completed ? "completed" : input.percentComplete > 0 ? "in_progress" : "not_started";

  await db
    .insert(lessonProgress)
    .values({
      userId: input.userId,
      courseId: row.course.id,
      lessonId: row.lesson.id,
      status,
      percentComplete: input.completed ? 100 : input.percentComplete,
      lastPositionSeconds: input.lastPositionSeconds,
      startedAt: input.percentComplete > 0 || input.completed ? now : null,
      completedAt: input.completed ? now : null,
    })
    .onDuplicateKeyUpdate({
      set: {
        status,
        percentComplete: input.completed ? 100 : input.percentComplete,
        lastPositionSeconds: input.lastPositionSeconds,
        startedAt: existing?.startedAt ?? (input.percentComplete > 0 || input.completed ? now : null),
        completedAt: input.completed ? existing?.completedAt ?? now : null,
      },
    });

  if (!existing || existing.status === "not_started") {
    await recordMemberActivity({
      userId: input.userId,
      type: "lesson_started",
      entityType: "lesson",
      entityId: String(row.lesson.id),
      titleSnapshot: row.lesson.title,
      metadata: { courseTitle: row.course.title },
    });
  }
  if (input.completed && existing?.status !== "completed") {
    await recordMemberActivity({
      userId: input.userId,
      type: "lesson_completed",
      entityType: "lesson",
      entityId: String(row.lesson.id),
      titleSnapshot: row.lesson.title,
      metadata: { courseTitle: row.course.title },
    });
  }

  return getPublishedCourse(input.userId, row.course.slug);
}

export async function getProtectedMediaUrl(mediaId: number) {
  const db = await requireDb();
  const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, mediaId)).limit(1);
  const asset = rows[0];
  if (!asset) return null;
  const result = await storageGet(asset.storageKey);
  return { ...result, mimeType: asset.mimeType, kind: asset.kind };
}
