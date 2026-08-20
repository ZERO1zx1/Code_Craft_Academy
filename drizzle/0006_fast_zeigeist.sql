CREATE TABLE `project_submission_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`repositoryUrl` varchar(1024) NOT NULL,
	`liveUrl` varchar(1024),
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_submission_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_submission_versions_submission_version_unique` UNIQUE(`submissionId`,`versionNumber`)
);
--> statement-breakpoint
CREATE TABLE `rubric_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` varchar(32) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`criteriaJson` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rubric_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','reviewer','teacher','admin','owner') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `project_attachments` ADD `versionNumber` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_submissions` ADD `rubricTemplateId` int;--> statement-breakpoint
ALTER TABLE `project_submissions` ADD `currentVersion` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `project_submission_versions` ADD CONSTRAINT `psv_submission_fk` FOREIGN KEY (`submissionId`) REFERENCES `project_submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rubric_templates` ADD CONSTRAINT `rubric_templates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
