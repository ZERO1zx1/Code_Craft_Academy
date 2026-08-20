import { describe, expect, it } from "vitest";
import { lessonDetails } from "../shared/curriculum";
import { courseDocuments } from "../shared/documents";
import { scoreQuizAnswers } from "../shared/quiz";

describe("quiz and reference library", () => {
  it("scores the Python conditions quiz from trusted curriculum answers", () => {
    const questions = lessonDetails["py-if"]?.quiz;
    expect(questions).toBeDefined();
    expect(questions).toHaveLength(2);

    const allCorrect = scoreQuizAnswers(questions!, questions!.map((question) => question.answer));
    const allWrong = scoreQuizAnswers(questions!, questions!.map(() => -1));

    expect(allCorrect).toEqual({ correct: 2, total: 2, percent: 100 });
    expect(allWrong).toEqual({ correct: 0, total: 2, percent: 0 });
  });

  it("exposes the supplied Python PDF to the in-app document reader", () => {
    const pythonReference = courseDocuments.find((document) => document.id === "python-keywords-mn");

    expect(pythonReference).toMatchObject({
      courseId: "python",
      kind: "pdf",
      pages: 29,
    });
    expect(pythonReference?.href).toMatch(/^\/manus-storage\/.*\.pdf$/);
  });
});
