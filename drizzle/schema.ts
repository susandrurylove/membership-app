import {
  bigint,
  boolean,
  char,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }).default("password"),
  passwordHash: varchar("passwordHash", { length: 255 }),
  accountStatus: mysqlEnum("accountStatus", ["invited", "active", "suspended"])
    .default("invited")
    .notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  invitationAcceptedAt: timestamp("invitationAcceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const memberSessions = mysqlTable(
  "member_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: char("tokenHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
    revokedAt: timestamp("revokedAt"),
    userAgent: varchar("userAgent", { length: 512 }),
    ipHash: char("ipHash", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    tokenHashUnique: uniqueIndex("member_sessions_token_hash_unique").on(table.tokenHash),
    userExpiresIndex: index("member_sessions_user_expires_idx").on(table.userId, table.expiresAt),
  })
);

export const memberships = mysqlTable(
  "memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tier: mysqlEnum("tier", ["silver", "gold", "platinum", "custom"])
      .default("silver")
      .notNull(),
    status: mysqlEnum("status", ["pending", "active", "paused", "cancelled", "expired"])
      .default("pending")
      .notNull(),
    source: mysqlEnum("source", ["manual", "thrivecart"]).default("manual").notNull(),
    startsAt: timestamp("startsAt"),
    endsAt: timestamp("endsAt"),
    graceEndsAt: timestamp("graceEndsAt"),
    externalCustomerId: varchar("externalCustomerId", { length: 128 }),
    externalSubscriptionId: varchar("externalSubscriptionId", { length: 128 }),
    externalProductId: varchar("externalProductId", { length: 128 }),
    internalNotes: text("internalNotes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userUnique: uniqueIndex("memberships_user_unique").on(table.userId),
    statusIndex: index("memberships_status_idx").on(table.status),
    externalCustomerIndex: index("memberships_external_customer_idx").on(table.externalCustomerId),
  })
);

export const invitationTokens = mysqlTable(
  "invitation_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: char("tokenHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    consumedAt: timestamp("consumedAt"),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    tokenHashUnique: uniqueIndex("invitation_tokens_token_hash_unique").on(table.tokenHash),
    userIndex: index("invitation_tokens_user_idx").on(table.userId),
  })
);

export const passwordResetTokens = mysqlTable(
  "password_reset_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: char("tokenHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    consumedAt: timestamp("consumedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    tokenHashUnique: uniqueIndex("password_reset_tokens_token_hash_unique").on(table.tokenHash),
    userIndex: index("password_reset_tokens_user_idx").on(table.userId),
  })
);

export const contentCategories = mysqlTable(
  "content_categories",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description"),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    slugUnique: uniqueIndex("content_categories_slug_unique").on(table.slug),
    sortIndex: index("content_categories_sort_idx").on(table.sortOrder),
  })
);

export const mediaAssets = mysqlTable(
  "media_assets",
  {
    id: int("id").autoincrement().primaryKey(),
    kind: mysqlEnum("kind", ["video", "audio", "image", "document"]).notNull(),
    storageProvider: varchar("storageProvider", { length: 32 }).default("bunny").notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    originalName: varchar("originalName", { length: 512 }).notNull(),
    mimeType: varchar("mimeType", { length: 160 }).notNull(),
    byteSize: bigint("byteSize", { mode: "number" }).notNull(),
    durationSeconds: int("durationSeconds"),
    width: int("width"),
    height: int("height"),
    altText: varchar("altText", { length: 512 }),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    storageKeyUnique: uniqueIndex("media_assets_storage_key_unique").on(table.storageKey),
    kindIndex: index("media_assets_kind_idx").on(table.kind),
  })
);

export const teachings = mysqlTable(
  "teachings",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("categoryId").references(() => contentCategories.id, { onDelete: "set null" }),
    title: varchar("title", { length: 240 }).notNull(),
    slug: varchar("slug", { length: 260 }).notNull(),
    summary: text("summary"),
    body: text("body"),
    contentType: mysqlEnum("contentType", ["video", "audio", "image", "text", "mixed"]).notNull(),
    status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
    featured: boolean("featured").default(false).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    publishedAt: timestamp("publishedAt"),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    slugUnique: uniqueIndex("teachings_slug_unique").on(table.slug),
    listingIndex: index("teachings_listing_idx").on(table.status, table.categoryId, table.sortOrder),
  })
);

export const teachingAssets = mysqlTable(
  "teaching_assets",
  {
    id: int("id").autoincrement().primaryKey(),
    teachingId: int("teachingId")
      .notNull()
      .references(() => teachings.id, { onDelete: "cascade" }),
    mediaAssetId: int("mediaAssetId")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    usage: mysqlEnum("usage", ["primary", "thumbnail", "attachment"]).default("primary").notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
  },
  table => ({
    teachingAssetUnique: uniqueIndex("teaching_assets_unique").on(table.teachingId, table.mediaAssetId),
    teachingSortIndex: index("teaching_assets_teaching_sort_idx").on(table.teachingId, table.sortOrder),
  })
);

export const courses = mysqlTable(
  "courses",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 240 }).notNull(),
    slug: varchar("slug", { length: 260 }).notNull(),
    summary: text("summary"),
    description: text("description"),
    status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
    coverAssetId: int("coverAssetId").references(() => mediaAssets.id, { onDelete: "set null" }),
    estimatedMinutes: int("estimatedMinutes"),
    sortOrder: int("sortOrder").default(0).notNull(),
    publishedAt: timestamp("publishedAt"),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    slugUnique: uniqueIndex("courses_slug_unique").on(table.slug),
    listingIndex: index("courses_listing_idx").on(table.status, table.sortOrder),
  })
);

export const courseSections = mysqlTable(
  "course_sections",
  {
    id: int("id").autoincrement().primaryKey(),
    courseId: int("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description"),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    courseSortIndex: index("course_sections_course_sort_idx").on(table.courseId, table.sortOrder),
  })
);

export const courseLessons = mysqlTable(
  "course_lessons",
  {
    id: int("id").autoincrement().primaryKey(),
    courseId: int("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    sectionId: int("sectionId").references(() => courseSections.id, { onDelete: "set null" }),
    title: varchar("title", { length: 240 }).notNull(),
    slug: varchar("slug", { length: 260 }).notNull(),
    summary: text("summary"),
    body: text("body"),
    contentType: mysqlEnum("contentType", ["video", "audio", "image", "text", "mixed"]).notNull(),
    mediaAssetId: int("mediaAssetId").references(() => mediaAssets.id, { onDelete: "set null" }),
    status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
    estimatedMinutes: int("estimatedMinutes"),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    courseSlugUnique: uniqueIndex("course_lessons_course_slug_unique").on(table.courseId, table.slug),
    courseSortIndex: index("course_lessons_course_sort_idx").on(table.courseId, table.sortOrder),
    sectionSortIndex: index("course_lessons_section_sort_idx").on(table.sectionId, table.sortOrder),
  })
);

export const lessonProgress = mysqlTable(
  "lesson_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: int("courseId")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lessonId: int("lessonId")
      .notNull()
      .references(() => courseLessons.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ["not_started", "in_progress", "completed"])
      .default("not_started")
      .notNull(),
    percentComplete: int("percentComplete").default(0).notNull(),
    lastPositionSeconds: int("lastPositionSeconds").default(0).notNull(),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userLessonUnique: uniqueIndex("lesson_progress_user_lesson_unique").on(table.userId, table.lessonId),
    userCourseIndex: index("lesson_progress_user_course_idx").on(table.userId, table.courseId),
  })
);

export const memberActivities = mysqlTable(
  "member_activities",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ["login", "teaching_viewed", "lesson_started", "lesson_completed", "app_launched"]).notNull(),
    entityType: varchar("entityType", { length: 64 }),
    entityId: varchar("entityId", { length: 128 }),
    titleSnapshot: varchar("titleSnapshot", { length: 320 }).notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userCreatedIndex: index("member_activities_user_created_idx").on(table.userId, table.createdAt),
  })
);

export const ssoLaunchGrants = mysqlTable(
  "sso_launch_grants",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    appKey: mysqlEnum("appKey", ["elevate", "enlightened_body", "tao"]).notNull(),
    audience: varchar("audience", { length: 160 }).notNull(),
    codeHash: char("codeHash", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    consumedAt: timestamp("consumedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    codeHashUnique: uniqueIndex("sso_launch_grants_code_hash_unique").on(table.codeHash),
    expiryIndex: index("sso_launch_grants_expiry_idx").on(table.expiresAt),
    userCreatedIndex: index("sso_launch_grants_user_created_idx").on(table.userId, table.createdAt),
  })
);

export const webhookDeliveries = mysqlTable(
  "webhook_deliveries",
  {
    id: int("id").autoincrement().primaryKey(),
    provider: varchar("provider", { length: 64 }).notNull(),
    deliveryId: varchar("deliveryId", { length: 160 }).notNull(),
    eventType: varchar("eventType", { length: 160 }).notNull(),
    payloadHash: char("payloadHash", { length: 64 }).notNull(),
    status: mysqlEnum("status", ["received", "processed", "ignored", "failed"])
      .default("received")
      .notNull(),
    errorMessage: text("errorMessage"),
    processedAt: timestamp("processedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    providerDeliveryUnique: uniqueIndex("webhook_deliveries_provider_delivery_unique").on(table.provider, table.deliveryId),
    statusCreatedIndex: index("webhook_deliveries_status_created_idx").on(table.status, table.createdAt),
  })
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 160 }).notNull(),
    targetType: varchar("targetType", { length: 80 }).notNull(),
    targetId: varchar("targetId", { length: 128 }),
    summary: varchar("summary", { length: 512 }).notNull(),
    metadata: json("metadata"),
    ipHash: char("ipHash", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    actorCreatedIndex: index("audit_logs_actor_created_idx").on(table.actorUserId, table.createdAt),
    targetIndex: index("audit_logs_target_idx").on(table.targetType, table.targetId),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MemberSession = typeof memberSessions.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Teaching = typeof teachings.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
