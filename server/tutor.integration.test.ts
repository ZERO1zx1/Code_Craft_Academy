import { describe, expect, it, vi } from "vitest";

const invokeLLM = vi.hoisted(() => vi.fn());
vi.mock("./_core/llm", () => ({ invokeLLM }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = { user: { id: 7, openId: "tutor-user", name: "Tutor User", email: "tutor@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;

describe("tutor.ask integration", () => {
  it("returns the model answer", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: "Алдааг эхлээд stack trace-оос хай." } }] });
    const result = await appRouter.createCaller(ctx).tutor.ask({ courseId: "python", lessonTitle: "if", question: "Яагаад ажиллахгүй байна?", code: "if True" });
    expect(result.answer).toContain("stack trace");
  });

  it("falls back for unusable model content", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: [] } }] });
    const result = await appRouter.createCaller(ctx).tutor.ask({ courseId: "javascript", lessonTitle: "DOM", question: "Яаж шалгах вэ?" });
    expect(result.answer).toContain("дахин оролдоно уу");
  });

  it("propagates an LLM failure for the client retry state", async () => {
    invokeLLM.mockRejectedValueOnce(new Error("temporary provider failure"));
    await expect(appRouter.createCaller(ctx).tutor.ask({ courseId: "css", lessonTitle: "Grid", question: "Яагаад багана үүсэхгүй вэ?" })).rejects.toThrow("temporary provider failure");
  });
});
