CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(160) NOT NULL,
	`targetType` varchar(80) NOT NULL,
	`targetId` varchar(128),
	`summary` varchar(512) NOT NULL,
	`metadata` json,
	`ipHash` char(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `course_lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`sectionId` int,
	`title` varchar(240) NOT NULL,
	`slug` varchar(260) NOT NULL,
	`summary` text,
	`body` text,
	`contentType` enum('video','audio','image','text','mixed') NOT NULL,
	`mediaAssetId` int,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`estimatedMinutes` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_lessons_id` PRIMARY KEY(`id`),
	CONSTRAINT `course_lessons_course_slug_unique` UNIQUE(`courseId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `course_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(240) NOT NULL,
	`slug` varchar(260) NOT NULL,
	`summary` text,
	`description` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`coverAssetId` int,
	`estimatedMinutes` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `invitation_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` char(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitation_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitation_tokens_token_hash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`lessonId` int NOT NULL,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`percentComplete` int NOT NULL DEFAULT 0,
	`lastPositionSeconds` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_progress_user_lesson_unique` UNIQUE(`userId`,`lessonId`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('video','audio','image','document') NOT NULL,
	`storageProvider` varchar(32) NOT NULL DEFAULT 's3',
	`storageKey` varchar(512) NOT NULL,
	`originalName` varchar(512) NOT NULL,
	`mimeType` varchar(160) NOT NULL,
	`byteSize` bigint NOT NULL,
	`durationSeconds` int,
	`width` int,
	`height` int,
	`altText` varchar(512),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_assets_storage_key_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE TABLE `member_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('login','teaching_viewed','lesson_started','lesson_completed','app_launched') NOT NULL,
	`entityType` varchar(64),
	`entityId` varchar(128),
	`titleSnapshot` varchar(320) NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `member_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` char(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	`userAgent` varchar(512),
	`ipHash` char(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `member_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `member_sessions_token_hash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('silver','gold','platinum','custom') NOT NULL DEFAULT 'silver',
	`status` enum('pending','active','paused','cancelled','expired') NOT NULL DEFAULT 'pending',
	`source` enum('manual','thrivecart') NOT NULL DEFAULT 'manual',
	`startsAt` timestamp,
	`endsAt` timestamp,
	`graceEndsAt` timestamp,
	`externalCustomerId` varchar(128),
	`externalSubscriptionId` varchar(128),
	`externalProductId` varchar(128),
	`internalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `memberships_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` char(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_hash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `sso_launch_grants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appKey` enum('elevate','enlightened_body','tao') NOT NULL,
	`audience` varchar(160) NOT NULL,
	`codeHash` char(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sso_launch_grants_id` PRIMARY KEY(`id`),
	CONSTRAINT `sso_launch_grants_code_hash_unique` UNIQUE(`codeHash`)
);
--> statement-breakpoint
CREATE TABLE `teaching_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teachingId` int NOT NULL,
	`mediaAssetId` int NOT NULL,
	`usage` enum('primary','thumbnail','attachment') NOT NULL DEFAULT 'primary',
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `teaching_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `teaching_assets_unique` UNIQUE(`teachingId`,`mediaAssetId`)
);
--> statement-breakpoint
CREATE TABLE `teachings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int,
	`title` varchar(240) NOT NULL,
	`slug` varchar(260) NOT NULL,
	`summary` text,
	`body` text,
	`contentType` enum('video','audio','image','text','mixed') NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`featured` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teachings_id` PRIMARY KEY(`id`),
	CONSTRAINT `teachings_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(64) NOT NULL,
	`deliveryId` varchar(160) NOT NULL,
	`eventType` varchar(160) NOT NULL,
	`payloadHash` char(64) NOT NULL,
	`status` enum('received','processed','ignored','failed') NOT NULL DEFAULT 'received',
	`errorMessage` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_deliveries_provider_delivery_unique` UNIQUE(`provider`,`deliveryId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'password';--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `accountStatus` enum('invited','active','suspended') DEFAULT 'invited' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `invitationAcceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD CONSTRAINT `course_lessons_courseId_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD CONSTRAINT `course_lessons_sectionId_course_sections_id_fk` FOREIGN KEY (`sectionId`) REFERENCES `course_sections`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD CONSTRAINT `course_lessons_mediaAssetId_media_assets_id_fk` FOREIGN KEY (`mediaAssetId`) REFERENCES `media_assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_sections` ADD CONSTRAINT `course_sections_courseId_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_coverAssetId_media_assets_id_fk` FOREIGN KEY (`coverAssetId`) REFERENCES `media_assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitation_tokens` ADD CONSTRAINT `invitation_tokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitation_tokens` ADD CONSTRAINT `invitation_tokens_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_courseId_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_lessonId_course_lessons_id_fk` FOREIGN KEY (`lessonId`) REFERENCES `course_lessons`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_activities` ADD CONSTRAINT `member_activities_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_sessions` ADD CONSTRAINT `member_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sso_launch_grants` ADD CONSTRAINT `sso_launch_grants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teaching_assets` ADD CONSTRAINT `teaching_assets_teachingId_teachings_id_fk` FOREIGN KEY (`teachingId`) REFERENCES `teachings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teaching_assets` ADD CONSTRAINT `teaching_assets_mediaAssetId_media_assets_id_fk` FOREIGN KEY (`mediaAssetId`) REFERENCES `media_assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teachings` ADD CONSTRAINT `teachings_categoryId_content_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `content_categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teachings` ADD CONSTRAINT `teachings_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_logs_actor_created_idx` ON `audit_logs` (`actorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_logs_target_idx` ON `audit_logs` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `content_categories_sort_idx` ON `content_categories` (`sortOrder`);--> statement-breakpoint
CREATE INDEX `course_lessons_course_sort_idx` ON `course_lessons` (`courseId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `course_lessons_section_sort_idx` ON `course_lessons` (`sectionId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `course_sections_course_sort_idx` ON `course_sections` (`courseId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `courses_listing_idx` ON `courses` (`status`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `invitation_tokens_user_idx` ON `invitation_tokens` (`userId`);--> statement-breakpoint
CREATE INDEX `lesson_progress_user_course_idx` ON `lesson_progress` (`userId`,`courseId`);--> statement-breakpoint
CREATE INDEX `media_assets_kind_idx` ON `media_assets` (`kind`);--> statement-breakpoint
CREATE INDEX `member_activities_user_created_idx` ON `member_activities` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `member_sessions_user_expires_idx` ON `member_sessions` (`userId`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `memberships_status_idx` ON `memberships` (`status`);--> statement-breakpoint
CREATE INDEX `memberships_external_customer_idx` ON `memberships` (`externalCustomerId`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_user_idx` ON `password_reset_tokens` (`userId`);--> statement-breakpoint
CREATE INDEX `sso_launch_grants_expiry_idx` ON `sso_launch_grants` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `sso_launch_grants_user_created_idx` ON `sso_launch_grants` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `teaching_assets_teaching_sort_idx` ON `teaching_assets` (`teachingId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `teachings_listing_idx` ON `teachings` (`status`,`categoryId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `webhook_deliveries_status_created_idx` ON `webhook_deliveries` (`status`,`createdAt`);