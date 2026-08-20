CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int,
	`action` varchar(120) NOT NULL,
	`targetType` varchar(80) NOT NULL,
	`targetId` varchar(160),
	`metadataJson` varchar(2000) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`completedTaskIdsJson` varchar(2000) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `onboarding_progress_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `staff_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('reviewer','teacher') NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`status` enum('pending','accepted','revoked','expired') NOT NULL DEFAULT 'pending',
	`invitedBy` int NOT NULL,
	`acceptedBy` int,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`acceptedAt` timestamp,
	`revokedAt` timestamp,
	CONSTRAINT `staff_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboarding_progress` ADD CONSTRAINT `onboarding_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_invitations` ADD CONSTRAINT `staff_invitations_invitedBy_users_id_fk` FOREIGN KEY (`invitedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff_invitations` ADD CONSTRAINT `staff_invitations_acceptedBy_users_id_fk` FOREIGN KEY (`acceptedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
