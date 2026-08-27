CREATE TABLE `assignment_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`userId` int NOT NULL,
	`response` text NOT NULL,
	`resourceUrl` varchar(1200),
	`state` enum('submitted','revised','graded') NOT NULL DEFAULT 'submitted',
	`score` int,
	`feedback` text,
	`gradedBy` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`gradedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignment_submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `assignment_submissions_user_assignment_unique` UNIQUE(`assignmentId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` varchar(32) NOT NULL,
	`lessonId` varchar(64) NOT NULL,
	`title` varchar(180) NOT NULL,
	`instructions` text NOT NULL,
	`criteria` text,
	`maxScore` int NOT NULL DEFAULT 100,
	`dueAt` timestamp,
	`status` enum('draft','published','closed') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assignment_submissions_assignment_idx` ON `assignment_submissions` (`assignmentId`);--> statement-breakpoint
CREATE INDEX `assignment_submissions_user_idx` ON `assignment_submissions` (`userId`);--> statement-breakpoint
CREATE INDEX `assignments_lesson_idx` ON `assignments` (`courseId`,`lessonId`);