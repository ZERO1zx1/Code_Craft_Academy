ALTER TABLE `audit_logs` MODIFY COLUMN `metadataJson` varchar(2000) NOT NULL;--> statement-breakpoint
ALTER TABLE `onboarding_progress` MODIFY COLUMN `completedTaskIdsJson` varchar(2000) NOT NULL;