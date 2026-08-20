CREATE TABLE `notification_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` int NOT NULL,
	`channel` enum('email','push') NOT NULL,
	`status` enum('sent','skipped','failed') NOT NULL,
	`detail` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`submissionId` int,
	`courseId` varchar(32) NOT NULL,
	`projectLessonId` varchar(96) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`storageKey` varchar(768) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`sizeBytes` int NOT NULL,
	`previewKind` enum('image','pdf','text','download') NOT NULL DEFAULT 'download',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` varchar(512) NOT NULL,
	`auth` varchar(512) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','reviewer','teacher','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `emailEnabled` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `browserPushEnabled` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_deliveries` ADD CONSTRAINT `nd_notification_fk` FOREIGN KEY (`notificationId`) REFERENCES `learner_notifications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_attachments` ADD CONSTRAINT `pa_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_attachments` ADD CONSTRAINT `pa_submission_fk` FOREIGN KEY (`submissionId`) REFERENCES `project_submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `push_subscriptions` ADD CONSTRAINT `ps_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
