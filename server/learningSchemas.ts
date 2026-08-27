import { z } from "zod";

export const courseIdSchema = z.enum(["html", "css", "javascript", "python"]);

export const lessonProgressInput = z.object({
  courseId: courseIdSchema,
  lessonId: z.string().trim().min(1).max(64),
  state: z.enum(["in_progress", "completed"]),
});

export const quizAttemptInput = z.object({
  courseId: courseIdSchema,
  lessonId: z.string().trim().min(1).max(64),
  score: z.number().int().min(0).max(20),
  total: z.number().int().min(1).max(20),
  passed: z.boolean(),
  answers: z.array(z.number().int().min(0).max(5)).min(1).max(20),
}).refine((value) => value.score <= value.total, {
  message: "Quiz score cannot exceed total questions",
  path: ["score"],
});

export const questionInput = z.object({
  courseId: courseIdSchema,
  lessonId: z.string().trim().min(1).max(64),
  body: z.string().trim().min(8, "Асуултаа арай дэлгэрэнгүй бичнэ үү.").max(1200),
});

export const replyInput = z.object({
  questionId: z.number().int().positive(),
  body: z.string().trim().min(2, "Хариулт хэт богино байна.").max(1200),
});

export const courseContentInput = z.object({
  courseId: courseIdSchema,
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().min(16).max(1200),
  durationMinutes: z.number().int().min(5).max(600),
  lessonCount: z.number().int().min(1).max(60),
  learningGoal: z.string().trim().max(600).nullable(),
  isPublished: z.boolean(),
});

export const adminProgressInput = z.object({
  userId: z.number().int().positive(),
  courseId: courseIdSchema,
  lessonId: z.string().trim().min(1).max(64),
  state: z.enum(["in_progress", "completed"]),
});

export const discussionInput = z.object({
  courseId: courseIdSchema,
  lessonId: z.string().trim().min(1).max(64),
  topic: z.string().trim().min(4, "Хэлэлцүүлгийн гарчиг хэт богино байна.").max(160),
  body: z.string().trim().min(10, "Сэтгэгдлээ арай дэлгэрэнгүй бичнэ үү.").max(1600),
});

export const discussionReplyInput = z.object({
  discussionId: z.number().int().positive(),
  body: z.string().trim().min(2, "Хариулт хэт богино байна.").max(1600),
});

export const discussionStatusInput = z.object({
  discussionId: z.number().int().positive(),
  status: z.enum(["open", "resolved"]),
});

export const assignmentInput = z.object({
  courseId: courseIdSchema,
  lessonId: z.string().trim().min(1).max(64),
  title: z.string().trim().min(5, "Даалгаврын гарчиг хэт богино байна.").max(180),
  instructions: z.string().trim().min(20, "Зааврыг арай дэлгэрэнгүй бичнэ үү.").max(5000),
  criteria: z.string().trim().max(3000).nullable(),
  maxScore: z.number().int().min(1).max(1000),
  dueAt: z.date().nullable(),
  status: z.enum(["draft", "published", "closed"]),
});

export const assignmentSubmissionInput = z.object({
  assignmentId: z.number().int().positive(),
  response: z.string().trim().min(20, "Илгээлтээ арай дэлгэрэнгүй тайлбарлана уу.").max(8000),
  resourceUrl: z.string().url("Холбоосын формат буруу байна.").max(1200).nullable(),
});

export const assignmentGradeInput = z.object({
  submissionId: z.number().int().positive(),
  score: z.number().int().min(0).max(1000),
  feedback: z.string().trim().min(3, "Feedback хэт богино байна.").max(5000),
}).refine((value) => value.score <= 1000, { message: "Оноо буруу байна.", path: ["score"] });

export const feedbackThreadInput = z.object({
  courseId: courseIdSchema.nullable(),
  lessonId: z.string().trim().min(1).max(64).nullable(),
  submissionId: z.number().int().positive().nullable(),
  subject: z.string().trim().min(4, "Feedback-ийн гарчиг хэт богино байна.").max(180),
  body: z.string().trim().min(8, "Feedback хүсэлтээ арай дэлгэрэнгүй бичнэ үү.").max(3000),
});

export const feedbackReplyInput = z.object({
  threadId: z.number().int().positive(),
  body: z.string().trim().min(2, "Feedback хариулт хэт богино байна.").max(3000),
});

export const feedbackReadInput = z.object({
  threadId: z.number().int().positive(),
});

export const notificationsReadInput = z.object({
  notificationIds: z.array(z.number().int().positive()).min(1).max(60).optional(),
});
