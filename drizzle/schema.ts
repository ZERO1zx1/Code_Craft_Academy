import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  displayName: varchar("displayName", { length: 80 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "reviewer", "teacher", "admin", "owner"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const courseProgress = mysqlTable("course_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  courseId: varchar("courseId", { length: 32 }).notNull(),
  progressPercent: int("progressPercent").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userCourseUnique: unique("course_progress_user_course_unique").on(table.userId, table.courseId),
}));

export type CourseProgress = typeof courseProgress.$inferSelect;
export type InsertCourseProgress = typeof courseProgress.$inferInsert;

export const badgeDefinitions = mysqlTable("badge_definitions", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description").notNull(),
  criteriaType: varchar("criteriaType", { length: 64 }).notNull(),
  criteriaValue: int("criteriaValue").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BadgeDefinition = typeof badgeDefinitions.$inferSelect;
export type InsertBadgeDefinition = typeof badgeDefinitions.$inferInsert;

export const learnerBadges = mysqlTable("learner_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  badgeId: int("badgeId").notNull().references(() => badgeDefinitions.id),
  awardedAt: timestamp("awardedAt").defaultNow().notNull(),
}, (table) => ({
  learnerBadgeUnique: unique("learner_badges_user_badge_unique").on(table.userId, table.badgeId),
}));

export type LearnerBadge = typeof learnerBadges.$inferSelect;
export type InsertLearnerBadge = typeof learnerBadges.$inferInsert;

export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  certificateType: varchar("certificateType", { length: 64 }).notNull(),
  verificationCode: varchar("verificationCode", { length: 96 }).notNull().unique(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
}, (table) => ({
  learnerCertificateUnique: unique("certificates_user_type_unique").on(table.userId, table.certificateType),
}));

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

export const quizAttempts = mysqlTable("quiz_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  courseId: varchar("courseId", { length: 32 }).notNull(),
  lessonId: varchar("lessonId", { length: 96 }).notNull(),
  score: int("score").notNull(),
  totalQuestions: int("totalQuestions").notNull(),
  answersJson: text("answersJson").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  learnerLessonAttemptUnique: unique("quiz_attempts_user_lesson_unique").on(table.userId, table.lessonId),
}));

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

export const projectSubmissions = mysqlTable("project_submissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  courseId: varchar("courseId", { length: 32 }).notNull(),
  projectLessonId: varchar("projectLessonId", { length: 96 }).notNull(),
  repositoryUrl: varchar("repositoryUrl", { length: 1024 }).notNull(),
  liveUrl: varchar("liveUrl", { length: 1024 }),
  summary: text("summary").notNull(),
  status: mysqlEnum("status", ["submitted", "in_review", "needs_revision", "approved"]).default("submitted").notNull(),
  functionalityScore: int("functionalityScore"),
  codeQualityScore: int("codeQualityScore"),
  userExperienceScore: int("userExperienceScore"),
  completenessScore: int("completenessScore"),
  totalScore: int("totalScore"),
  teacherFeedback: text("teacherFeedback"),
  rubricTemplateId: int("rubricTemplateId"),
  currentVersion: int("currentVersion").default(1).notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
}, (table) => ({
  learnerCourseProjectUnique: unique("project_submissions_user_course_unique").on(table.userId, table.courseId),
}));

export type ProjectSubmission = typeof projectSubmissions.$inferSelect;
export type InsertProjectSubmission = typeof projectSubmissions.$inferInsert;

export const projectAttachments = mysqlTable("project_attachments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  submissionId: int("submissionId").references(() => projectSubmissions.id),
  courseId: varchar("courseId", { length: 32 }).notNull(),
  projectLessonId: varchar("projectLessonId", { length: 96 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 768 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  previewKind: mysqlEnum("previewKind", ["image", "pdf", "text", "download"]).default("download").notNull(),
  versionNumber: int("versionNumber").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectAttachment = typeof projectAttachments.$inferSelect;
export type InsertProjectAttachment = typeof projectAttachments.$inferInsert;

export const rubricTemplates = mysqlTable("rubric_templates", {
  id: int("id").autoincrement().primaryKey(),
  courseId: varchar("courseId", { length: 32 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull(),
  criteriaJson: text("criteriaJson").notNull(),
  isActive: int("isActive").default(0).notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RubricTemplate = typeof rubricTemplates.$inferSelect;
export type InsertRubricTemplate = typeof rubricTemplates.$inferInsert;

export const projectSubmissionVersions = mysqlTable("project_submission_versions", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull().references(() => projectSubmissions.id),
  versionNumber: int("versionNumber").notNull(),
  repositoryUrl: varchar("repositoryUrl", { length: 1024 }).notNull(),
  liveUrl: varchar("liveUrl", { length: 1024 }),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  submissionVersionUnique: unique("project_submission_versions_submission_version_unique").on(table.submissionId, table.versionNumber),
}));

export type ProjectSubmissionVersion = typeof projectSubmissionVersions.$inferSelect;
export type InsertProjectSubmissionVersion = typeof projectSubmissionVersions.$inferInsert;

export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  lessonUpdatesEnabled: int("lessonUpdatesEnabled").default(1).notNull(),
  quizResultsEnabled: int("quizResultsEnabled").default(1).notNull(),
  projectFeedbackEnabled: int("projectFeedbackEnabled").default(1).notNull(),
  emailEnabled: int("emailEnabled").default(0).notNull(),
  browserPushEnabled: int("browserPushEnabled").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  learnerNotificationPreferenceUnique: unique("notification_preferences_user_unique").on(table.userId),
}));

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

export const learnerNotifications = mysqlTable("learner_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["lesson", "quiz", "project"]).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  content: text("content").notNull(),
  href: varchar("href", { length: 512 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LearnerNotification = typeof learnerNotifications.$inferSelect;
export type InsertLearnerNotification = typeof learnerNotifications.$inferInsert;

export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  p256dh: varchar("p256dh", { length: 512 }).notNull(),
  auth: varchar("auth", { length: 512 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

export const notificationDeliveries = mysqlTable("notification_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  notificationId: int("notificationId").notNull().references(() => learnerNotifications.id),
  channel: mysqlEnum("channel", ["email", "push"]).notNull(),
  status: mysqlEnum("status", ["sent", "skipped", "failed"]).notNull(),
  detail: varchar("detail", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type InsertNotificationDelivery = typeof notificationDeliveries.$inferInsert;

/**
 * Immutable, owner-visible record of management-relevant system activity.
 * Metadata is intentionally JSON text so callers can retain only safe, non-secret context.
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").references(() => users.id),
  action: varchar("action", { length: 120 }).notNull(),
  targetType: varchar("targetType", { length: 80 }).notNull(),
  targetId: varchar("targetId", { length: 160 }),
  metadataJson: varchar("metadataJson", { length: 2000 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * A staff invitation stores only a one-way token hash. The raw acceptance token
 * is returned once to the owner and sent to the intended email address.
 */
export const staffInvitations = mysqlTable("staff_invitations", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["reviewer", "teacher"]).notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "revoked", "expired"]).default("pending").notNull(),
  invitedBy: int("invitedBy").notNull().references(() => users.id),
  acceptedBy: int("acceptedBy").references(() => users.id),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  revokedAt: timestamp("revokedAt"),
});

export type StaffInvitation = typeof staffInvitations.$inferSelect;
export type InsertStaffInvitation = typeof staffInvitations.$inferInsert;

/**
 * Per-user completion state for static, role-aware onboarding tasks.
 */
export const onboardingProgress = mysqlTable("onboarding_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  completedTaskIdsJson: varchar("completedTaskIdsJson", { length: 2000 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  onboardingProgressUserUnique: unique("onboarding_progress_user_unique").on(table.userId),
}));

export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = typeof onboardingProgress.$inferInsert;
