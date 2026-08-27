import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createAssignment: vi.fn(), createCourseQuestion: vi.fn(), createDiscussionReply: vi.fn(), createFeedbackThread: vi.fn(), createLessonDiscussion: vi.fn(), createQuestionReply: vi.fn(), getCertificateStatus: vi.fn(), getLearnerAnalytics: vi.fn(), getLearningOverview: vi.fn(), getTeacherOverview: vi.fn(), gradeAssignmentSubmission: vi.fn(), issueCertificateIfEligible: vi.fn(), listCourseContent: vi.fn(), listCourseQuestions: vi.fn(), listFeedbackThreads: vi.fn(), listLessonDiscussions: vi.fn(), listLearnerAssignments: vi.fn(), listNotifications: vi.fn(), markFeedbackMessagesRead: vi.fn(), markLessonProgress: vi.fn(), markNotificationsRead: vi.fn(), replyToFeedbackThread: vi.fn(), saveQuizAttempt: vi.fn(), setDiscussionStatus: vi.fn(), submitAssignment: vi.fn(), updateCourseContent: vi.fn(), updateLearnerProgressAsAdmin: vi.fn(),
}));
vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

function context(role: "user" | "admin" = "user"): TrpcContext {
  return { user: { id: 55, openId: "feedback-test", name: "Feedback Test", email: "feedback@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("feedback and notification routes", () => {
  it("creates a learner feedback request and forwards the authenticated learner identity", async () => {
    dbMocks.createFeedbackThread.mockResolvedValue({ id: 7 });
    const caller = appRouter.createCaller(context());
    await expect(caller.feedback.create({ courseId: "html", lessonId: "html-document", submissionId: null, subject: "Semantic tag-ийн тайлбар", body: "`header` болон `main` element-ийн хэрэглээний ялгааг жишээгээр тайлбарлаж өгнө үү." })).resolves.toMatchObject({ id: 7 });
    expect(dbMocks.createFeedbackThread).toHaveBeenCalledWith(55, expect.objectContaining({ courseId: "html" }));
  });

  it("keeps feedback inbox, reply, message-read, notification list, and read action behind authenticated contracts", async () => {
    dbMocks.listFeedbackThreads.mockResolvedValue([]); dbMocks.replyToFeedbackThread.mockResolvedValue({ id: 9 }); dbMocks.markFeedbackMessagesRead.mockResolvedValue({ success: true }); dbMocks.listNotifications.mockResolvedValue({ rows: [{ id: 1, readAt: null }], unreadCount: 1 }); dbMocks.markNotificationsRead.mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.feedback.mine()).resolves.toEqual([]);
    await expect(caller.feedback.reply({ threadId: 7, body: "`main` нь тухайн хуудасны гол, давтагдашгүй агуулгыг заана." })).resolves.toMatchObject({ id: 9 });
    await expect(caller.feedback.markRead({ threadId: 7 })).resolves.toEqual({ success: true });
    await expect(caller.notifications.list()).resolves.toEqual({ rows: [{ id: 1, readAt: null }], unreadCount: 1 });
    await expect(caller.notifications.markRead({ notificationIds: [1, 2] })).resolves.toEqual({ success: true });
    expect(dbMocks.listFeedbackThreads).toHaveBeenCalledWith(55, "admin");
    expect(dbMocks.replyToFeedbackThread).toHaveBeenCalledWith(55, "admin", expect.objectContaining({ threadId: 7 }));
  });

  it("rejects feedback requests with an implausibly short body", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.feedback.create({ courseId: "html", lessonId: "html-document", submissionId: null, subject: "test", body: "short" })).rejects.toThrow();
  });
});
