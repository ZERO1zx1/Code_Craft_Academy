/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { PracticeGuide } from "./PracticeGuide";

const cases = [
  ["html", "sandboxed preview", "MDN HTML"],
  ["css", "CSSOM", "MDN CSS"],
  ["javascript", "Web Worker", "MDN JavaScript"],
  ["python", "Pyodide worker", "Python Docs"],
  ["github", "command simulator", "GitHub Docs"],
] as const;

describe("language-aware practice guides", () => {
  afterEach(() => cleanup());

  it("renders a distinct practice boundary and official next-step source for every course", () => {
    cases.forEach(([language, phrase, sourceLabel]) => {
      render(<PracticeGuide language={language} source="https://example.com/reference" sourceLabel={sourceLabel} />);
      expect(screen.getByText("Энд юу туршиж, дараа нь хаана үргэлжлүүлэх вэ?")).toBeTruthy();
      expect(screen.getByText(new RegExp(phrase))).toBeTruthy();
      expect(screen.getByRole("link", { name: new RegExp(sourceLabel) }).getAttribute("href")).toBe("https://example.com/reference");
      cleanup();
    });
  });
});
