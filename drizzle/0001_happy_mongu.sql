CREATE TABLE `course_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` varchar(32) NOT NULL,
	`progressPercent` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `course_progress_user_course_unique` UNIQUE(`userId`,`courseId`)
);
--> statement-breakpoint
ALTER TABLE `course_progress` ADD CONSTRAINT `course_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;