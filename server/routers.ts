import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAssignment, createCourseQuestion, createDiscussionReply, createFeedbackThread, createLessonDiscussion, createQuestionReply,
  getCertificateStatus, getLearnerAnalytics, getLearningOverview, getTeacherOverview, gradeAssignmentSubmission, issueCertificateIfEligible,
  listCourseContent, listCourseQuestions, listFeedbackThreads, listLessonDiscussions, listLearnerAssignments, listNotifications,
  markFeedbackMessagesRead, markLessonProgress, markNotificationsRead, replyToFeedbackThread, saveQuizAttempt, setDiscussionStatus,
  submitAssignment, updateCourseContent, updateLearnerProgressAsAdmin,
} from "./db";
import {
  adminProgressInput, assignmentGradeInput, assignmentInput, assignmentSubmissionInput, courseContentInput, courseIdSchema,
  discussionInput, discussionReplyInput, discussionStatusInput, feedbackReadInput, feedbackReplyInput, feedbackThreadInput,
  lessonProgressInput, notificationsReadInput, questionInput, quizAttemptInput, replyInput,
} from "./learningSchemas";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  courses: router({ list: publicProcedure.query(() => listCourseContent(false)) }),
  learning: router({
    overview: protectedProcedure.query(({ ctx }) => getLearningOverview(ctx.user.id)),
    analytics: protectedProcedure.query(({ ctx }) => getLearnerAnalytics(ctx.user.id)),
    markLesson: protectedProcedure.input(lessonProgressInput).mutation(({ ctx, input }) => markLessonProgress(ctx.user.id, input)),
    saveQuiz: protectedProcedure.input(quizAttemptInput).mutation(({ ctx, input }) => saveQuizAttempt(ctx.user.id, input)),
  }),
  certificates: router({
    status: protectedProcedure.query(({ ctx }) => getCertificateStatus(ctx.user.id)),
    issue: protectedProcedure.mutation(({ ctx }) => issueCertificateIfEligible(ctx.user.id)),
  }),
  questions: router({
    list: protectedProcedure.input(z.object({ courseId: courseIdSchema, lessonId: z.string().trim().min(1).max(64) })).query(({ input }) => listCourseQuestions(input.courseId, input.lessonId)),
    create: protectedProcedure.input(questionInput).mutation(({ ctx, input }) => createCourseQuestion(ctx.user.id, input)),
    reply: protectedProcedure.input(replyInput).mutation(({ ctx, input }) => createQuestionReply(ctx.user.id, input)),
  }),
  discussions: router({
    list: protectedProcedure.input(z.object({ courseId: courseIdSchema, lessonId: z.string().trim().min(1).max(64) })).query(({ input }) => listLessonDiscussions(input.courseId, input.lessonId)),
    create: protectedProcedure.input(discussionInput).mutation(({ ctx, input }) => createLessonDiscussion(ctx.user.id, input)),
    reply: protectedProcedure.input(discussionReplyInput).mutation(({ ctx, input }) => createDiscussionReply(ctx.user.id, input)),
    setStatus: protectedProcedure.input(discussionStatusInput).mutation(({ ctx, input }) => setDiscussionStatus(ctx.user.id, ctx.user.role === "admin", input)),
  }),
  assignments: router({
    mine: protectedProcedure.query(({ ctx }) => listLearnerAssignments(ctx.user.id)),
    submit: protectedProcedure.input(assignmentSubmissionInput).mutation(({ ctx, input }) => submitAssignment(ctx.user.id, input)),
  }),
  feedback: router({
    mine: protectedProcedure.query(({ ctx }) => listFeedbackThreads(ctx.user.id, ctx.user.role)),
    create: protectedProcedure.input(feedbackThreadInput).mutation(({ ctx, input }) => createFeedbackThread(ctx.user.id, input)),
    reply: protectedProcedure.input(feedbackReplyInput).mutation(({ ctx, input }) => replyToFeedbackThread(ctx.user.id, ctx.user.role, input)),
    markRead: protectedProcedure.input(feedbackReadInput).mutation(({ ctx, input }) => markFeedbackMessagesRead(ctx.user.id, ctx.user.role, input.threadId)),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(notificationsReadInput).mutation(({ ctx, input }) => markNotificationsRead(ctx.user.id, input.notificationIds)),
  }),
  admin: router({
    overview: adminProcedure.query(() => getTeacherOverview()),
    updateCourse: adminProcedure.input(courseContentInput).mutation(({ ctx, input }) => updateCourseContent(ctx.user.id, input)),
    updateProgress: adminProcedure.input(adminProgressInput).mutation(({ input }) => updateLearnerProgressAsAdmin(input)),
    createAssignment: adminProcedure.input(assignmentInput).mutation(({ ctx, input }) => createAssignment(ctx.user.id, input)),
    gradeSubmission: adminProcedure.input(assignmentGradeInput).mutation(({ ctx, input }) => gradeAssignmentSubmission(ctx.user.id, input)),
  }),
});

export type AppRouter = typeof appRouter;
