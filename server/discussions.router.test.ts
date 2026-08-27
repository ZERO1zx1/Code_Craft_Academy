import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createCourseQuestion: vi.fn(),
  createDiscussionReply: vi.fn(),
  createLessonDiscussion: vi.fn(),
  createQuestionReply: vi.fn(),
  getCertificateStatus: vi.fn(),
  getLearningOverview: vi.fn(),
  getTeacherOverview: vi.fn(),
  issueCertificateIfEligible: vi.fn(),
  listCourseContent: vi.fn(),
  listCourseQuestions: vi.fn(),
  listLessonDiscussions: vi.fn(),
  markLessonProgress: vi.fn(),
  saveQuizAttempt: vi.fn(),
  setDiscussionStatus: vi.fn(),
  updateCourseContent: vi.fn(),
  updateLearnerProgressAsAdmin: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function context(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: { id: 17, openId: "discussion-tester", name: "Discussion Tester", email: "tester@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("discussion router", () => {
  it("lists lesson conversations for a valid authenticated learner", async () => {
    dbMocks.listLessonDiscussions.mockResolvedValue([]);
    const caller = appRouter.createCaller(context());
    await expect(caller.discussions.list({ courseId: "html", lessonId: "semantic-foundations" })).resolves.toEqual([]);
    expect(dbMocks.listLessonDiscussions).toHaveBeenCalledWith("html", "semantic-foundations");
  });

  it("creates a learner discussion and persists an authenticated reply", async () => {
    dbMocks.createLessonDiscussion.mockResolvedValue({ id: 10 });
    dbMocks.createDiscussionReply.mockResolvedValue({ id: 11 });
    const caller = appRouter.createCaller(context());
    await caller.discussions.create({ courseId: "css", lessonId: "box-model-basics", topic: "Padding ба margin", body: "Эдгээр хоёр ойлголтын ялгааг жишээгээр харьцуулж өгнө үү." });
    await caller.discussions.reply({ discussionId: 10, body: "Padding нь border-ын дотор, margin нь гаднах зай юм." });
    expect(dbMocks.createLessonDiscussion).toHaveBeenCalledWith(17, expect.objectContaining({ courseId: "css" }));
    expect(dbMocks.createDiscussionReply).toHaveBeenCalledWith(17, expect.objectContaining({ discussionId: 10 }));
  });

  it("forwards the learner role and requested status to the persistence policy", async () => {
    dbMocks.setDiscussionStatus.mockResolvedValue({ discussionId: 10, status: "resolved" });
    const caller = appRouter.createCaller(context());
    await caller.discussions.setStatus({ discussionId: 10, status: "resolved" });
    expect(dbMocks.setDiscussionStatus).toHaveBeenCalledWith(17, false, { discussionId: 10, status: "resolved" });
  });
});
