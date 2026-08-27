import { describe, expect, it } from "vitest";
import { assignmentGradeInput, assignmentInput, assignmentSubmissionInput, discussionInput, discussionReplyInput, discussionStatusInput, lessonProgressInput, questionInput, quizAttemptInput } from "./learningSchemas";

describe("learning input validation", () => {
  it("accepts a valid completed lesson update", () => {
    expect(lessonProgressInput.parse({ courseId: "html", lessonId: "semantic-foundations", state: "completed" })).toMatchObject({ state: "completed" });
  });

  it("rejects quiz scores above their total", () => {
    expect(() => quizAttemptInput.parse({ courseId: "css", lessonId: "box-model", score: 4, total: 3, passed: true, answers: [0, 1, 2] })).toThrow();
  });

  it("requires a meaningful course question", () => {
    expect(() => questionInput.parse({ courseId: "python", lessonId: "lists", body: "why" })).toThrow();
  });

  it("accepts a complete course discussion and validates its reply", () => {
    expect(discussionInput.parse({ courseId: "javascript", lessonId: "functions-and-conditions", topic: "Function-ийн scope", body: "Function доторх хувьсагч гадагш гарахгүй байгаа шалтгааныг тайлбарлаж өгнө үү." }).topic).toBe("Function-ийн scope");
    expect(discussionReplyInput.parse({ discussionId: 12, body: "Энэ нь block scope болон function scope-оос хамаарна." }).discussionId).toBe(12);
  });

  it("rejects an invalid discussion status", () => {
    expect(() => discussionStatusInput.parse({ discussionId: 3, status: "archived" })).toThrow();
  });

  it("validates teacher assignment, learner submission, and grading inputs", () => {
    expect(assignmentInput.parse({ courseId: "html", lessonId: "html-document", title: "Semantic profile page", instructions: "Semantic element ашиглан profile хуудасны бүтцийг гаргана уу.", criteria: "main, section, heading hierarchy ашигласан байх.", maxScore: 100, dueAt: null, status: "published" }).status).toBe("published");
    expect(assignmentSubmissionInput.parse({ assignmentId: 8, response: "Header, main, section, article ашиглан profile page-ийн бүтцийг semantic байдлаар хийлээ.", resourceUrl: "https://example.com/project" }).assignmentId).toBe(8);
    expect(assignmentGradeInput.parse({ submissionId: 8, score: 92, feedback: "Semantic structure зөв, heading hierarchy-г нэг удаа дахин шалгаарай." }).score).toBe(92);
  });

  it("rejects a malformed assignment resource link", () => {
    expect(() => assignmentSubmissionInput.parse({ assignmentId: 8, response: "Энэ тайлбар нь шаардлагатай уртад хүрч байгаа бодит илгээлтийн тайлбар юм.", resourceUrl: "not a url" })).toThrow();
  });
});
