CREATE TABLE `quiz_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` varchar(32) NOT NULL,
	`lessonId` varchar(96) NOT NULL,
	`score` int NOT NULL,
	`totalQuestions` int NOT NULL,
	`answersJson` text NOT NULL,
	`submittedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quiz_attempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `quiz_attempts_user_lesson_unique` UNIQUE(`userId`,`lessonId`)
);
--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD CONSTRAINT `quiz_attempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;