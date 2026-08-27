/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { buildLessonQuiz } from "@/lib/curriculumQuiz";
import { LessonQuiz } from "./LessonQuiz";

const questions = buildLessonQuiz({ lessonId: "js-const", language: "javascript", term: "const", meaning: "Дахин оноохгүй binding.", code: "const topic = 'JS';", starter: "const topic = '';", expected: ["const"] });

describe("ten-question lesson quiz", () => {
  it("moves through ten varied questions and shows an explanation-rich result", () => {
    render(<LessonQuiz questions={questions} />);
    expect(screen.getByText("10-QUESTION QUIZ · 1 / 10")).toBeTruthy();
    for (let index = 0; index < 10; index += 1) {
      fireEvent.click(screen.getAllByRole("button", { name: /^A/ })[0]);
      if (index < 9) fireEvent.click(screen.getByRole("button", { name: "Дараах асуулт" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Дүнгээ харах" }));
    expect(screen.getByText("Таны дүн: 10 / 10")).toBeTruthy();
    expect(screen.getAllByText(/CONCEPT CHECK|KEYWORD FINDER|OUTPUT PREDICT|DEBUG DIAGNOSIS|BUILD REQUIREMENT|CODE REVIEW|MEANING MATCH|REQUIREMENT CHECK|PRACTICE DECISION|SOURCE AWARENESS/).length).toBeGreaterThanOrEqual(10);
    fireEvent.click(screen.getByRole("button", { name: "10 асуултаа дахин хийх" }));
    expect(screen.getByText("10-QUESTION QUIZ · 1 / 10")).toBeTruthy();
  });
});
