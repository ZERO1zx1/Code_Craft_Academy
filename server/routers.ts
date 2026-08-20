import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, ownerProcedure, protectedProcedure, publicProcedure, reviewerProcedure, router, teacherProcedure } from "./_core/trpc";
import { z } from "zod";
import { acceptStaffInvitation, activateRubricTemplate, appendAuditLog, clearPushSubscriptions, completeOnboardingTask, createLearnerNotification, createRubricTemplate, createStaffInvitation, exportRubricTemplates, getAchievementsForUser, getAuditLogs, getCourseProgressForUser, getLearnerNotifications, getNotificationAnalytics, getNotificationPreferences, getOnboardingProgress, getProjectAttachmentsForUser, getProjectSubmissionForUser, getProjectSubmissionHistory, getProjectSubmissionVersionDiff, getPublicProfile, getPushSubscription, getQuizAttemptForUser, getRoleDirectory, getRubricTemplates, getTeacherDashboard, getTeacherGradeReport, importRubricTemplates, listStaffInvitations, markLearnerNotificationRead, publishLessonNotification, removeProjectAttachment, revokeStaffInvitation, reviewProjectSubmission, saveProjectSubmission, saveQuizAttempt, updateNotificationPreferences, updateUserDisplayName, updateUserRole, upsertCourseProgress, upsertPushSubscription } from "./db";
import { invokeLLM } from "./_core/llm";
import { deliverStaffInvitationEmail } from "./notificationDelivery";
import { scoreQuizAnswers } from "../shared/quiz";
import { lessonDetails } from "../shared/curriculum";

export function formatTutorAnswer(content: unknown) {
  if (typeof content === "string" && content.trim()) return content;
  if (Array.isArray(content)) {
    const text = content.map((part) => typeof part === "object" && part !== null && "text" in part ? String((part as { text?: unknown }).text ?? "") : "").join("").trim();
    if (text) return text;
  }
  return "Одоогоор tutor-ийн хариу бэлэн болсонгүй. Асуултаа арай дэлгэрэнгүй бичээд дахин оролдоно уу.";
}

const courseIdSchema = z.enum(["python", "html", "css", "javascript"]);
const rubricCriteriaSchema = z.array(z.object({
  id: z.string().min(1).max(48),
  label: z.string().min(2).max(120),
  maxPoints: z.number().int().min(1).max(100),
  description: z.string().max(500).optional(),
})).min(2).max(8).refine((criteria) => criteria.reduce((total, criterion) => total + criterion.maxPoints, 0) === 100, { message: "Rubric-ийн нийт оноо 100 байх ёстой." });

const rubricTransferDocumentSchema = z.object({
  format: z.literal("codecraft-rubric/v1"),
  templates: z.array(z.object({
    courseId: courseIdSchema,
    name: z.string().min(3).max(120),
    description: z.string().min(8).max(2000),
    criteria: rubricCriteriaSchema,
    makeActive: z.boolean().default(false),
  })).min(1).max(40),
});

const onboardingTaskIdsByRole: Record<string, readonly string[]> = {
  user: ["profile-finish", "first-lesson", "editor-open"],
  reviewer: ["reviewer-dashboard", "reviewer-review", "notification-inbox"],
  teacher: ["teacher-dashboard", "teacher-rubric", "teacher-publish"],
  admin: ["owner-operations", "owner-invitations", "owner-audit"],
  owner: ["owner-operations", "owner-invitations", "owner-audit"],
};

function getTrustedRequestOrigin(request: { headers?: { origin?: string | string[] } }) {
  const raw = Array.isArray(request.headers?.origin) ? request.headers?.origin[0] : request.headers?.origin;
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  profile: router({
    public: publicProcedure.input(z.object({ userId: z.number().int().positive() })).query(({ input }) => getPublicProfile(input.userId)),
    updateDisplayName: protectedProcedure
      .input(z.object({ displayName: z.string().trim().min(2, "Дэлгэцийн нэр дор хаяж 2 тэмдэгттэй байна.").max(80, "Дэлгэцийн нэр 80 тэмдэгтээс урт байж болохгүй.") }))
      .mutation(({ ctx, input }) => updateUserDisplayName({ userId: ctx.user.id, displayName: input.displayName })),
  }),

  onboarding: router({
    progress: protectedProcedure.query(({ ctx }) => getOnboardingProgress(ctx.user.id)),
    complete: protectedProcedure
      .input(z.object({ taskId: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/, "Даалгаврын таних тэмдэг буруу байна.") }))
      .mutation(({ ctx, input }) => {
        const allowedTaskIds = onboardingTaskIdsByRole[ctx.user.role] ?? onboardingTaskIdsByRole.user;
        if (!allowedTaskIds.includes(input.taskId)) throw new Error("Таны эрхэд хамаарах танилцах даалгавар биш байна.");
        return completeOnboardingTask({ userId: ctx.user.id, taskId: input.taskId });
      }),
  }),

  progress: router({
    list: protectedProcedure.query(({ ctx }) => getCourseProgressForUser(ctx.user.id)),
    achievements: protectedProcedure.query(({ ctx }) => getAchievementsForUser(ctx.user.id)),
    update: protectedProcedure
      .input(z.object({ courseId: z.enum(["python", "html", "css", "javascript"]), progressPercent: z.number().int().min(0).max(100) }))
      .mutation(({ ctx, input }) => upsertCourseProgress({ userId: ctx.user.id, courseId: input.courseId, progressPercent: input.progressPercent })),
  }),

  quiz: router({
    getAttempt: protectedProcedure
      .input(z.object({ lessonId: z.string().min(1).max(96) }))
      .query(({ ctx, input }) => getQuizAttemptForUser(ctx.user.id, input.lessonId)),
    submit: protectedProcedure
      .input(z.object({
        courseId: z.enum(["python", "html", "css", "javascript"]),
        lessonId: z.string().min(1).max(96),
        answers: z.array(z.number().int().min(0).max(12)).min(1).max(50),
      }))
      .mutation(({ ctx, input }) => {
        const questions = lessonDetails[input.lessonId]?.quiz;
        if (!questions?.length) throw new Error("This lesson has no quiz questions yet");
        const result = scoreQuizAnswers(questions, input.answers);
        return saveQuizAttempt({
          userId: ctx.user.id,
          courseId: input.courseId,
          lessonId: input.lessonId,
          score: result.percent,
          totalQuestions: result.total,
          answers: input.answers,
        }).then(async (attempt) => {
          await createLearnerNotification({
            userId: ctx.user.id,
            type: "quiz",
            title: "Quiz-ийн үр дүн бэлэн боллоо",
            content: `${input.lessonId} хичээлийн оноо: ${result.percent}% (${result.correct}/${result.total}).`,
            href: `/quiz/${input.courseId}/${input.lessonId}`,
          });
          return attempt;
        });
      }),
  }),

  projects: router({
    getMine: protectedProcedure
      .input(z.object({ courseId: z.enum(["python", "html", "css", "javascript"]) }))
      .query(({ ctx, input }) => getProjectSubmissionForUser(ctx.user.id, input.courseId)),
    attachments: protectedProcedure
      .input(z.object({ courseId: z.enum(["python", "html", "css", "javascript"]) }))
      .query(({ ctx, input }) => getProjectAttachmentsForUser(ctx.user.id, input.courseId)),
    history: protectedProcedure
      .input(z.object({ courseId: z.enum(["python", "html", "css", "javascript"]) }))
      .query(({ ctx, input }) => getProjectSubmissionHistory(ctx.user.id, input.courseId)),
    compareVersions: protectedProcedure
      .input(z.object({ courseId: courseIdSchema, fromVersion: z.number().int().positive(), toVersion: z.number().int().positive() }))
      .query(({ ctx, input }) => getProjectSubmissionVersionDiff({ userId: ctx.user.id, ...input })),
    rubrics: protectedProcedure
      .input(z.object({ courseId: z.enum(["python", "html", "css", "javascript"]) }))
      .query(({ input }) => getRubricTemplates(input.courseId)),
    removeAttachment: protectedProcedure
      .input(z.object({ attachmentId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => removeProjectAttachment({ userId: ctx.user.id, attachmentId: input.attachmentId })),
    submit: protectedProcedure
      .input(z.object({
        courseId: z.enum(["python", "html", "css", "javascript"]),
        projectLessonId: z.string().min(3).max(96),
        repositoryUrl: z.string().url().max(1024),
        liveUrl: z.string().url().max(1024).optional().or(z.literal("")),
        summary: z.string().min(40).max(5000),
      }))
      .mutation(({ ctx, input }) => saveProjectSubmission({
        userId: ctx.user.id,
        courseId: input.courseId,
        projectLessonId: input.projectLessonId,
        repositoryUrl: input.repositoryUrl,
        liveUrl: input.liveUrl || undefined,
        summary: input.summary,
      })),
  }),

  notifications: router({
    list: protectedProcedure.query(({ ctx }) => getLearnerNotifications(ctx.user.id)),
    preferences: protectedProcedure.query(({ ctx }) => getNotificationPreferences(ctx.user.id)),
    updatePreferences: protectedProcedure
      .input(z.object({ lessonUpdatesEnabled: z.boolean(), quizResultsEnabled: z.boolean(), projectFeedbackEnabled: z.boolean(), emailEnabled: z.boolean(), browserPushEnabled: z.boolean() }))
      .mutation(({ ctx, input }) => updateNotificationPreferences({ userId: ctx.user.id, ...input })),
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => markLearnerNotificationRead(ctx.user.id, input.notificationId)),
    pushConfig: protectedProcedure.query(() => ({ publicKey: process.env.VAPID_PUBLIC_KEY ?? null })),
    pushSubscription: protectedProcedure.query(({ ctx }) => getPushSubscription(ctx.user.id)),
    savePushSubscription: protectedProcedure
      .input(z.object({ endpoint: z.string().url().max(2000), p256dh: z.string().min(20).max(512), auth: z.string().min(8).max(512) }))
      .mutation(({ ctx, input }) => upsertPushSubscription({ userId: ctx.user.id, ...input })),
    clearPushSubscription: protectedProcedure.mutation(({ ctx }) => clearPushSubscriptions(ctx.user.id)),
    deliveryAnalytics: reviewerProcedure.query(() => getNotificationAnalytics()),
  }),

  teacher: router({
    dashboard: reviewerProcedure.query(() => getTeacherDashboard()),
    reviewProject: reviewerProcedure
      .input(z.object({
        submissionId: z.number().int().positive(),
        status: z.enum(["needs_revision", "approved"]),
        functionalityScore: z.number().int().min(0).max(40),
        codeQualityScore: z.number().int().min(0).max(25),
        userExperienceScore: z.number().int().min(0).max(20),
        completenessScore: z.number().int().min(0).max(15),
        teacherFeedback: z.string().min(12).max(5000),
      }))
      .mutation(({ ctx, input }) => reviewProjectSubmission({ reviewerId: ctx.user.id, ...input })),
    publishLesson: teacherProcedure
      .input(z.object({
        courseId: z.enum(["python", "html", "css", "javascript"]),
        title: z.string().min(5).max(160),
        content: z.string().min(12).max(2000),
      }))
      .mutation(({ input }) => publishLessonNotification(input)),
    createRubric: teacherProcedure
      .input(z.object({
        courseId: z.enum(["python", "html", "css", "javascript"]),
        name: z.string().min(3).max(120),
        description: z.string().min(8).max(2000),
        makeActive: z.boolean().default(false),
        criteria: z.array(z.object({ id: z.string().min(1).max(48), label: z.string().min(2).max(120), maxPoints: z.number().int().min(1).max(100), description: z.string().max(500).optional() })).min(2).max(8),
      }).refine((input) => input.criteria.reduce((total, criterion) => total + criterion.maxPoints, 0) === 100, { message: "Rubric-ийн нийт оноо 100 байх ёстой." }))
      .mutation(({ ctx, input }) => createRubricTemplate({ ...input, createdBy: ctx.user.id })),
    activateRubric: teacherProcedure
      .input(z.object({ templateId: z.number().int().positive(), courseId: z.enum(["python", "html", "css", "javascript"]) }))
      .mutation(({ input }) => activateRubricTemplate(input)),
    gradeReport: teacherProcedure.query(() => getTeacherGradeReport()),
    exportRubrics: ownerProcedure
      .input(z.object({ courseId: courseIdSchema.optional() }).optional())
      .query(async ({ ctx, input }) => {
        const result = await exportRubricTemplates(input?.courseId);
        await appendAuditLog({ actorId: ctx.user.id, action: "rubric_exported", targetType: "rubric_templates", targetId: input?.courseId ?? null, metadata: { courseId: input?.courseId ?? "all", templateCount: result.templates.length } });
        return result;
      }),
    importRubrics: ownerProcedure
      .input(rubricTransferDocumentSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await importRubricTemplates({ templates: input.templates, createdBy: ctx.user.id });
        await appendAuditLog({ actorId: ctx.user.id, action: "rubric_imported", targetType: "rubric_templates", metadata: { templateCount: result.imported } });
        return result;
      }),
    roleDirectory: adminProcedure.query(() => getRoleDirectory()),
    setRole: adminProcedure
      .input(z.object({ userId: z.number().int().positive(), role: z.enum(["user", "reviewer", "teacher", "admin"]) }))
      .mutation(({ ctx, input }) => updateUserRole({ ...input, actorId: ctx.user.id })),
  }),

  owner: router({
    auditLog: ownerProcedure
      .input(z.object({
        limit: z.number().int().min(5).max(50).default(20),
        offset: z.number().int().min(0).default(0),
        action: z.string().trim().min(1).max(120).optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      }).default({ limit: 20, offset: 0 }))
      .query(({ input }) => getAuditLogs({
        ...input,
        from: input.from ? new Date(input.from) : undefined,
        to: input.to ? new Date(input.to) : undefined,
      })),
    invitations: router({
      list: ownerProcedure.query(() => listStaffInvitations()),
      create: ownerProcedure
        .input(z.object({ email: z.string().trim().email("Хүчинтэй и-мэйл хаяг оруулна уу.").max(320), role: z.enum(["reviewer", "teacher"]) }))
        .mutation(async ({ ctx, input }) => {
          const created = await createStaffInvitation({ ...input, invitedBy: ctx.user.id });
          const origin = getTrustedRequestOrigin(ctx.req);
          const emailDelivery = await deliverStaffInvitationEmail({
            email: created.invitation.email,
            role: input.role,
            acceptUrl: origin ? `${origin}/invite/accept?token=${encodeURIComponent(created.token)}` : null,
          });
          await appendAuditLog({
            actorId: ctx.user.id,
            action: `invitation_email_${emailDelivery.status}`,
            targetType: "staff_invitation",
            targetId: String(created.invitation.id),
            metadata: { transport: "gmail_smtp", status: emailDelivery.status },
          });
          return { ...created, emailDelivery };
        }),
      revoke: ownerProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(({ ctx, input }) => revokeStaffInvitation({ ...input, actorId: ctx.user.id })),
      accept: protectedProcedure
        .input(z.object({ token: z.string().min(20).max(120) }))
        .mutation(({ ctx, input }) => acceptStaffInvitation({ token: input.token, acceptedBy: ctx.user.id })),
    }),
  }),

  certificate: router({
    verify: publicProcedure.input(z.object({ verificationCode: z.string().min(8).max(96) })).query(async ({ input }) => {
      const { getCertificateByVerificationCode } = await import("./db");
      return getCertificateByVerificationCode(input.verificationCode);
    }),
  }),

  tutor: router({
    ask: protectedProcedure
      .input(z.object({ courseId: z.enum(["python", "html", "css", "javascript"]), lessonTitle: z.string().max(160), question: z.string().min(1).max(4000), code: z.string().max(12000).optional() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are CodeCraft Academy's patient coding tutor. Answer in Mongolian. Give a short explanation, then one guided hint, then one tiny next step. Do not dump a full solution unless the learner explicitly asks after trying. Never execute, download, or recommend unsafe code. If code is provided, point to the likely issue without claiming certainty." },
            { role: "user", content: `Course: ${input.courseId}\nLesson: ${input.lessonTitle}\nQuestion: ${input.question}\nCode:\n${input.code ?? "(no code provided)"}` },
          ],
        });
        const content = response.choices?.[0]?.message?.content;
        return { answer: formatTutorAnswer(content) };
      }),
  }),
});

export type AppRouter = typeof appRouter;
