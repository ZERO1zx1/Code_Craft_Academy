import { describe, expect, it } from "vitest";
import { findLesson, findPath, languagePaths } from "./curriculumData";
import { jsAssertions, pythonAssertions } from "../components/LessonChallenge";

describe("CodeCraft language curriculum", () => {
  it("keeps HTML, CSS, JavaScript, Python, and GitHub as five separate learning paths", () => {
    expect(languagePaths.map((path) => path.id)).toEqual(["html", "css", "javascript", "python", "github"]);
    expect(new Set(languagePaths.map((path) => path.id)).size).toBe(5);
  });

  it("gives every language path at least twenty ordered atomic lessons with keyword and challenge contracts", () => {
    languagePaths.forEach((path) => {
      expect(path.lessons.length).toBeGreaterThanOrEqual(20);
      expect(path.lessons.map((lesson) => lesson.order)).toEqual(Array.from({ length: path.lessons.length }, (_, index) => index + 1));
      path.lessons.forEach((lesson) => {
        expect(lesson.keywords.length).toBeGreaterThanOrEqual(1);
        expect(lesson.challenge.prompt.length).toBeGreaterThan(12);
        expect(lesson.challenge.xp).toBeGreaterThan(0);
        expect(lesson.quiz).toHaveLength(10);
        expect(new Set(lesson.quiz?.map((question) => question.kind)).size).toBeGreaterThanOrEqual(5);
      });
    });
  });

  it("progresses each path from beginner to core and stretch practice guidance", () => {
    languagePaths.forEach((path) => {
      expect(path.lessons[0].title).toContain("АНХАН");
      expect(path.lessons[8].title).toContain("СУУРЬ");
      expect(path.lessons[path.lessons.length - 1].title).toContain("СОРИЛТ");
    });
  });

  it("falls back to the first path and lesson for invalid route parameters", () => {
    const path = findPath("not-a-language");
    expect(path.id).toBe("html");
    expect(findLesson(path, "unknown").id).toBe("html-what-is-html");
  });

  it("maps every JavaScript and Python challenge to an explicit or generic runtime behavior assertion", () => {
    ["javascript", "python"].forEach((language) => {
      const path = languagePaths.find((item) => item.id === language)!;
      path.lessons.forEach((lesson) => {
        const assertion = language === "javascript" ? jsAssertions[lesson.id] : pythonAssertions[lesson.id];
        expect(Boolean(assertion) || lesson.challenge.starter.includes("quest-ok")).toBe(true);
      });
    });
    expect(pythonAssertions["py-modules-files"]).toBe("assert content == 'CodeCraft'");
    expect(pythonAssertions["py-modules-files"]).not.toContain("__user_code__");
  });

  it("keeps official source attribution and multiple quest modes in the detailed paths", () => {
    const modes = new Set(languagePaths.flatMap((path) => path.lessons.map((lesson) => lesson.challenge.kind ?? "build")));
    expect(modes).toEqual(new Set(["build", "debug", "predict", "timed"]));
    languagePaths.forEach((path) => {
      expect(path.source).toMatch(/^https:\/\//);
      expect(path.sourceLabel.length).toBeGreaterThan(8);
    });
  });
});
