CREATE TABLE `feedback_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`senderId` int NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback_threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`teacherId` int NOT NULL,
	`courseId` varchar(32),
	`lessonId` varchar(64),
	`submissionId` int,
	`subject` varchar(180) NOT NULL,
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('feedback_reply','assignment_graded','quest_unlocked','certificate_issued') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`actionUrl` varchar(500),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `feedback_messages_thread_idx` ON `feedback_messages` (`threadId`);--> statement-breakpoint
CREATE INDEX `feedback_threads_learner_idx` ON `feedback_threads` (`learnerId`);--> statement-breakpoint
CREATE INDEX `feedback_threads_teacher_idx` ON `feedback_threads` (`teacherId`);--> statement-breakpoint
CREATE INDEX `feedback_threads_lesson_idx` ON `feedback_threads` (`courseId`,`lessonId`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`userId`,`readAt`);