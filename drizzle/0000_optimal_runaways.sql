CREATE TABLE `course_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` varchar(32) NOT NULL,
	`lessonId` varchar(64) NOT NULL,
	`body` text NOT NULL,
	`status` enum('open','answered') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` varchar(32) NOT NULL,
	`lessonId` varchar(64) NOT NULL,
	`state` enum('in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_progress_user_lesson_unique` UNIQUE(`userId`,`courseId`,`lessonId`)
);
--> statement-breakpoint
CREATE TABLE `question_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`userId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `question_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` varchar(32) NOT NULL,
	`lessonId` varchar(64) NOT NULL,
	`score` int NOT NULL,
	`total` int NOT NULL,
	`passed` boolean NOT NULL,
	`answers` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `course_questions_lesson_idx` ON `course_questions` (`courseId`,`lessonId`);--> statement-breakpoint
CREATE INDEX `lesson_progress_user_idx` ON `lesson_progress` (`userId`);--> statement-breakpoint
CREATE INDEX `question_replies_question_idx` ON `question_replies` (`questionId`);--> statement-breakpoint
CREATE INDEX `quiz_attempts_user_idx` ON `quiz_attempts` (`userId`);