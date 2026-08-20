import { describe, expect, it } from "vitest";
import { scoreQuizAnswers } from "./quiz";

describe("scoreQuizAnswers", () => {
  const questions = [
    { prompt: "One", options: ["a", "b"], answer: 0, explanation: "a" },
    { prompt: "Two", options: ["a", "b"], answer: 1, explanation: "b" },
  ];

  it("scores selected answers deterministically", () => {
    expect(scoreQuizAnswers(questions, [0, 1])).toEqual({ correct: 2, total: 2, percent: 100 });
    expect(scoreQuizAnswers(questions, [1, 1])).toEqual({ correct: 1, total: 2, percent: 50 });
  });
});
