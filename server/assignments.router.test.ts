import { describe, expect, it, vi } from "vitest";
import { NOT_ADMIN_ERR_MSG } from "../shared/const";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createAssignment: vi.fn(), createCourseQuestion: vi.fn(), createDiscussionReply: vi.fn(), createLessonDiscussion: vi.fn(), createQuestionReply: vi.fn(), getCertificateStatus: vi.fn(), getLearnerAnalytics: vi.fn(), getLearningOverview: vi.fn(), getTeacherOverview: vi.fn(), gradeAssignmentSubmission: vi.fn(), issueCertificateIfEligible: vi.fn(), listCourseContent: vi.fn(), listCourseQuestions: vi.fn(), listLearnerAssignments: vi.fn(), listLessonDiscussions: vi.fn(), markLessonProgress: vi.fn(), saveQuizAttempt: vi.fn(), setDiscussionStatus: vi.fn(), submitAssignment: vi.fn(), updateCourseContent: vi.fn(), updateLearnerProgressAsAdmin: vi.fn(),
}));
vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

function context(role: "user" | "admin" = "user"): TrpcContext {
  return { user: { id: 31, openId: "assignment-test", name: "Assignment Test", email: "assignment@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("assignment and analytics routes", () => {
  it("allows an authenticated learner to read assignments, submit work, and view their own analytics", async () => {
    dbMocks.listLearnerAssignments.mockResolvedValue([]);
    dbMocks.submitAssignment.mockResolvedValue({ id: 9 });
    dbMocks.getLearnerAnalytics.mockResolvedValue({ courses: [], progress: [], attempts: [], assignments: [] });
    const caller = appRouter.createCaller(context());
    await expect(caller.assignments.mine()).resolves.toEqual([]);
    await caller.assignments.submit({ assignmentId: 4, response: "Энэ илгээлт нь хангалттай дэлгэрэнгүй бөгөөд ажлын алхмуудыг тайлбарласан байна.", resourceUrl: null });
    await expect(caller.learning.analytics()).resolves.toMatchObject({ courses: [] });
    expect(dbMocks.listLearnerAssignments).toHaveBeenCalledWith(31);
    expect(dbMocks.submitAssignment).toHaveBeenCalledWith(31, expect.objectContaining({ assignmentId: 4 }));
    expect(dbMocks.getLearnerAnalytics).toHaveBeenCalledWith(31);
  });

  it("rejects assignment creation and grading for a non-admin learner", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.admin.createAssignment({ courseId: "html", lessonId: "html-document", title: "Semantic exercise", instructions: "Semantic element ашиглан profile page-ийн бүтцийг ойлгомжтой хийнэ үү.", criteria: null, maxScore: 100, dueAt: null, status: "published" })).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    await expect(caller.admin.gradeSubmission({ submissionId: 8, score: 90, feedback: "Хийц сайн байна." })).rejects.toThrow(NOT_ADMIN_ERR_MSG);
  });
});
