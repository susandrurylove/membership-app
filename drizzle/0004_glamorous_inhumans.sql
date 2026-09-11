CREATE TABLE `daily_teaching_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dailyTeachingId` int NOT NULL,
	`scheduledDate` date NOT NULL,
	`frequency` enum('daily','weekly') NOT NULL,
	`status` enum('pending','sending','sent','skipped','failed') NOT NULL DEFAULT 'pending',
	`provider` varchar(32) NOT NULL DEFAULT 'smtp2go',
	`providerMessageId` varchar(255),
	`attemptCount` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_teaching_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_teaching_deliveries_unique` UNIQUE(`userId`,`dailyTeachingId`,`scheduledDate`)
);
--> statement-breakpoint
CREATE TABLE `daily_teaching_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`frequency` enum('off','daily','weekly') NOT NULL DEFAULT 'off',
	`timezone` varchar(80) NOT NULL DEFAULT 'America/Denver',
	`preferredHour` int NOT NULL DEFAULT 8,
	`promptDismissedAt` timestamp,
	`lastSentAt` timestamp,
	`nextDueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_teaching_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_teaching_preferences_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `daily_teachings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequence` int NOT NULL,
	`sourceKey` varchar(320) NOT NULL,
	`sourceType` varchar(32) NOT NULL,
	`sourceTitle` varchar(320) NOT NULL,
	`sourceLocator` varchar(320),
	`sourceUrl` varchar(1024),
	`existingTeachingSlug` varchar(260),
	`collection` varchar(160) NOT NULL,
	`slug` varchar(260) NOT NULL,
	`title` varchar(240) NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`reflectionPrompt` text NOT NULL,
	`practice` text NOT NULL,
	`sourceNote` text NOT NULL,
	`safetyNote` text,
	`medicalDisclaimer` boolean NOT NULL DEFAULT false,
	`imageUrl` varchar(1024) NOT NULL,
	`imageAlt` varchar(512) NOT NULL,
	`totalWordCount` int NOT NULL,
	`contentHash` char(64) NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_teachings_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_teachings_sequence_unique` UNIQUE(`sequence`),
	CONSTRAINT `daily_teachings_source_key_unique` UNIQUE(`sourceKey`),
	CONSTRAINT `daily_teachings_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `daily_teaching_deliveries` ADD CONSTRAINT `daily_teaching_deliveries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_teaching_deliveries` ADD CONSTRAINT `daily_teaching_deliveries_dailyTeachingId_daily_teachings_id_fk` FOREIGN KEY (`dailyTeachingId`) REFERENCES `daily_teachings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_teaching_preferences` ADD CONSTRAINT `daily_teaching_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `daily_teaching_deliveries_status_idx` ON `daily_teaching_deliveries` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `daily_teaching_preferences_due_idx` ON `daily_teaching_preferences` (`frequency`,`nextDueAt`);--> statement-breakpoint
CREATE INDEX `daily_teachings_status_sequence_idx` ON `daily_teachings` (`status`,`sequence`);