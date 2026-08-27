import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core identity table maintained by Manus OAuth. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** One durable learning state for every learner and lesson pair. */
export const lessonProgress = mysqlTable(
  "lesson_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    courseId: varchar("courseId", { length: 32 }).notNull(),
    lessonId: varchar("lessonId", { length: 64 }).notNull(),
    state: mysqlEnum("state", ["in_progress", "completed"])
      .default("in_progress")
      .notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("lesson_progress_user_lesson_unique").on(
      table.userId,
      table.courseId,
      table.lessonId,
    ),
    index("lesson_progress_user_idx").on(table.userId),
  ],
);

/** Immutable quiz history: every completed quiz run remains visible to the learner. */
export const quizAttempts = mysqlTable(
  "quiz_attempts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    courseId: varchar("courseId", { length: 32 }).notNull(),
    lessonId: varchar("lessonId", { length: 64 }).notNull(),
    score: int("score").notNull(),
    total: int("total").notNull(),
    passed: boolean("passed").notNull(),
    answers: json("answers").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("quiz_attempts_user_idx").on(table.userId)],
);

/** Course-specific questions are created only by authenticated learners. */
export const courseQuestions = mysqlTable(
  "course_questions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    courseId: varchar("courseId", { length: 32 }).notNull(),
    lessonId: varchar("lessonId", { length: 64 }).notNull(),
    body: text("body").notNull(),
    status: mysqlEnum("status", ["open", "answered"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("course_questions_lesson_idx").on(table.courseId, table.lessonId)],
);

/** Answers stay separate so a question can support an ongoing discussion. */
export const questionReplies = mysqlTable(
  "question_replies",
  {
    id: int("id").autoincrement().primaryKey(),
    questionId: int("questionId").notNull(),
    userId: int("userId").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("question_replies_question_idx").on(table.questionId)],
);

/** Teacher-managed course copy that feeds the learner-facing curriculum. */
export const courseContent = mysqlTable("course_content", {
  courseId: varchar("courseId", { length: 32 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  lessonCount: int("lessonCount").notNull(),
  learningGoal: text("learningGoal"),
  isPublished: boolean("isPublished").default(true).notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** One credential is issued automatically once a learner meets every course requirement. */
export const certificates = mysqlTable(
  "certificates",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    credentialId: varchar("credentialId", { length: 48 }).notNull().unique(),
    completionSnapshot: json("completionSnapshot").notNull(),
    issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("certificates_user_unique").on(table.userId)],
);

/** An open-ended learner conversation belongs to one concrete course lesson. */
export const lessonDiscussions = mysqlTable(
  "lesson_discussions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    courseId: varchar("courseId", { length: 32 }).notNull(),
    lessonId: varchar("lessonId", { length: 64 }).notNull(),
    topic: varchar("topic", { length: 160 }).notNull(),
    body: text("body").notNull(),
    status: mysqlEnum("status", ["open", "resolved"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("lesson_discussions_lesson_idx").on(table.courseId, table.lessonId)],
);

/** Replies make discussion threads collaborative without seeding any fictional learner content. */
export const discussionReplies = mysqlTable(
  "discussion_replies",
  {
    id: int("id").autoincrement().primaryKey(),
    discussionId: int("discussionId").notNull(),
    userId: int("userId").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("discussion_replies_discussion_idx").on(table.discussionId)],
);

/** Teacher-authored practical work attached to one course lesson. */
export const assignments = mysqlTable(
  "assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    courseId: varchar("courseId", { length: 32 }).notNull(),
    lessonId: varchar("lessonId", { length: 64 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    instructions: text("instructions").notNull(),
    criteria: text("criteria"),
    maxScore: int("maxScore").default(100).notNull(),
    dueAt: timestamp("dueAt"),
    status: mysqlEnum("status", ["draft", "published", "closed"]).default("draft").notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("assignments_lesson_idx").on(table.courseId, table.lessonId)],
);

/** One mutable submission per learner and assignment, retaining the latest grading decision. */
export const assignmentSubmissions = mysqlTable(
  "assignment_submissions",
  {
    id: int("id").autoincrement().primaryKey(),
    assignmentId: int("assignmentId").notNull(),
    userId: int("userId").notNull(),
    response: text("response").notNull(),
    resourceUrl: varchar("resourceUrl", { length: 1200 }),
    state: mysqlEnum("state", ["submitted", "revised", "graded"]).default("submitted").notNull(),
    score: int("score"),
    feedback: text("feedback"),
    gradedBy: int("gradedBy"),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
    gradedAt: timestamp("gradedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("assignment_submissions_user_assignment_unique").on(table.assignmentId, table.userId),
    index("assignment_submissions_assignment_idx").on(table.assignmentId),
    index("assignment_submissions_user_idx").on(table.userId),
  ],
);

/** A private teacher-learner feedback conversation may be linked to a lesson or assignment. */
export const feedbackThreads = mysqlTable(
  "feedback_threads",
  {
    id: int("id").autoincrement().primaryKey(),
    learnerId: int("learnerId").notNull(),
    teacherId: int("teacherId").notNull(),
    courseId: varchar("courseId", { length: 32 }),
    lessonId: varchar("lessonId", { length: 64 }),
    submissionId: int("submissionId"),
    subject: varchar("subject", { length: 180 }).notNull(),
    status: mysqlEnum("status", ["open", "resolved"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("feedback_threads_learner_idx").on(table.learnerId),
    index("feedback_threads_teacher_idx").on(table.teacherId),
    index("feedback_threads_lesson_idx").on(table.courseId, table.lessonId),
  ],
);

/** Every feedback message carries its sender and optional read timestamp. */
export const feedbackMessages = mysqlTable(
  "feedback_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    threadId: int("threadId").notNull(),
    senderId: int("senderId").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("feedback_messages_thread_idx").on(table.threadId)],
);

/** Durable in-app notifications let users catch up after returning to the academy. */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", ["feedback_reply", "assignment_graded", "quest_unlocked", "certificate_issued"]).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    actionUrl: varchar("actionUrl", { length: 500 }),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("notifications_user_read_idx").on(table.userId, table.readAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
