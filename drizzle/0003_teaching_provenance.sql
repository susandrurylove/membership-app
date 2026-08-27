CREATE TABLE `content_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` char(64) NOT NULL,
	`recordCount` int NOT NULL,
	`sourceSummary` varchar(512) NOT NULL,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_imports_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_imports_version_unique` UNIQUE(`version`)
);
--> statement-breakpoint
ALTER TABLE `teachings` ADD `sourceKey` varchar(320);--> statement-breakpoint
ALTER TABLE `teachings` ADD `sourceType` varchar(32);--> statement-breakpoint
ALTER TABLE `teachings` ADD `sourceUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `teachings` ADD `sourceTitle` varchar(320);--> statement-breakpoint
ALTER TABLE `teachings` ADD `sourceLocator` varchar(320);--> statement-breakpoint
ALTER TABLE `teachings` ADD `sourceYear` int;--> statement-breakpoint
ALTER TABLE `teachings` ADD `sourcePublishedAt` timestamp;--> statement-breakpoint
ALTER TABLE `teachings` ADD `readingMinutes` int;--> statement-breakpoint
ALTER TABLE `teachings` ADD `keyThemes` json;--> statement-breakpoint
ALTER TABLE `teachings` ADD `reflectionPrompts` json;--> statement-breakpoint
ALTER TABLE `teachings` ADD `practiceInvitation` text;--> statement-breakpoint
ALTER TABLE `teachings` ADD `sensitiveContentNotes` json;--> statement-breakpoint
ALTER TABLE `teachings` ADD `medicalDisclaimer` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `teachings` ADD `sourceCategories` json;--> statement-breakpoint
ALTER TABLE `teachings` ADD `heroImageUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `teachings` ADD `contentHash` char(64);--> statement-breakpoint
ALTER TABLE `teachings` ADD `importedAt` timestamp;--> statement-breakpoint
ALTER TABLE `teachings` ADD CONSTRAINT `teachings_source_key_unique` UNIQUE(`sourceKey`);--> statement-breakpoint
CREATE INDEX `content_imports_imported_at_idx` ON `content_imports` (`importedAt`);--> statement-breakpoint
CREATE INDEX `teachings_source_published_idx` ON `teachings` (`sourcePublishedAt`);