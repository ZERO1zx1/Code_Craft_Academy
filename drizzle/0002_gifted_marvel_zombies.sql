CREATE TABLE `badge_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`title` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`criteriaType` varchar(64) NOT NULL,
	`criteriaValue` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badge_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `badge_definitions_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`certificateType` varchar(64) NOT NULL,
	`verificationCode` varchar(96) NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_verificationCode_unique` UNIQUE(`verificationCode`),
	CONSTRAINT `certificates_user_type_unique` UNIQUE(`userId`,`certificateType`)
);
--> statement-breakpoint
CREATE TABLE `learner_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`awardedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learner_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `learner_badges_user_badge_unique` UNIQUE(`userId`,`badgeId`)
);
--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_badges` ADD CONSTRAINT `learner_badges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_badges` ADD CONSTRAINT `learner_badges_badgeId_badge_definitions_id_fk` FOREIGN KEY (`badgeId`) REFERENCES `badge_definitions`(`id`) ON DELETE no action ON UPDATE no action;