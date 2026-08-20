CREATE TABLE `learner_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('lesson','quiz','project') NOT NULL,
	`title` varchar(160) NOT NULL,
	`content` text NOT NULL,
	`href` varchar(512),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learner_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonUpdatesEnabled` int NOT NULL DEFAULT 1,
	`quizResultsEnabled` int NOT NULL DEFAULT 1,
	`projectFeedbackEnabled` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `project_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` varchar(32) NOT NULL,
	`projectLessonId` varchar(96) NOT NULL,
	`repositoryUrl` varchar(1024) NOT NULL,
	`liveUrl` varchar(1024),
	`summary` text NOT NULL,
	`status` enum('submitted','in_review','needs_revision','approved') NOT NULL DEFAULT 'submitted',
	`functionalityScore` int,
	`codeQualityScore` int,
	`userExperienceScore` int,
	`completenessScore` int,
	`totalScore` int,
	`teacherFeedback` text,
	`reviewedBy` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`reviewedAt` timestamp,
	CONSTRAINT `project_submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_submissions_user_course_unique` UNIQUE(`userId`,`courseId`)
);
--> statement-breakpoint
ALTER TABLE `learner_notifications` ADD CONSTRAINT `learner_notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_submissions` ADD CONSTRAINT `project_submissions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_submissions` ADD CONSTRAINT `project_submissions_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;