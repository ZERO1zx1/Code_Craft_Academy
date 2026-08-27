import { describe, expect, it } from "vitest";
import { buildLessonQuiz } from "./curriculumQuiz";

describe("lesson quiz generator", () => {
  it("creates ten lesson-aware questions across multiple code-learning modes", () => {
    const quiz = buildLessonQuiz({ lessonId: "html-h1", language: "html", term: "<h1>", meaning: "Гол гарчиг.", code: "<h1>Title</h1>", starter: "<h1></h1>", expected: ["h1"] });
    expect(quiz).toHaveLength(10);
    expect(new Set(quiz.map((question) => question.kind)).size).toBeGreaterThanOrEqual(5);
    expect(quiz.every((question) => question.choices.length === 3 && question.answer >= 0 && question.answer < 3)).toBe(true);
    expect(quiz.some((question) => question.code?.includes("<h1>"))).toBe(true);
  });
});
