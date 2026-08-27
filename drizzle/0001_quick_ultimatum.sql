CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`credentialId` varchar(48) NOT NULL,
	`completionSnapshot` json NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_credentialId_unique` UNIQUE(`credentialId`),
	CONSTRAINT `certificates_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `course_content` (
	`courseId` varchar(32) NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`durationMinutes` int NOT NULL,
	`lessonCount` int NOT NULL,
	`learningGoal` text,
	`isPublished` boolean NOT NULL DEFAULT true,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_content_courseId` PRIMARY KEY(`courseId`)
);
--> statement-breakpoint
CREATE TABLE `discussion_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discussionId` int NOT NULL,
	`userId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discussion_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_discussions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` varchar(32) NOT NULL,
	`lessonId` varchar(64) NOT NULL,
	`topic` varchar(160) NOT NULL,
	`body` text NOT NULL,
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_discussions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `discussion_replies_discussion_idx` ON `discussion_replies` (`discussionId`);--> statement-breakpoint
CREATE INDEX `lesson_discussions_lesson_idx` ON `lesson_discussions` (`courseId`,`lessonId`);