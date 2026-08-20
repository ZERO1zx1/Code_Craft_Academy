import { describe, expect, it } from "vitest";
import { courseCoverage, curriculum, lessonDetails, learningPath, pythonKeywordInventory, pythonKeywordLessonMapping } from "../shared/curriculum";

describe("curriculum integrity", () => {
  it("has real details and at least two quiz questions for every lesson", () => {
    const lessons = curriculum.flatMap((course) => course.lessons);
    expect(lessons.length).toBeGreaterThan(20);
    for (const lesson of lessons) {
      const details = lessonDetails[lesson.id];
      expect(details?.examples.length).toBeGreaterThan(0);
      expect(details?.advancedPractice.length).toBeGreaterThan(20);
      expect(details?.quiz.length).toBeGreaterThanOrEqual(2);
      expect(details?.quiz.every((question) => question.options.length >= 3)).toBe(true);
    }
  });

  it("maps every PDF keyword to an existing Python lesson", () => {
    const pythonLessonIds = new Set(curriculum.find((course) => course.id === "python")?.lessons.map((lesson) => lesson.id));
    expect(pythonKeywordInventory).toHaveLength(20);
    for (const keyword of pythonKeywordInventory) expect(pythonLessonIds.has(pythonKeywordLessonMapping[keyword])).toBe(true);
  });

  it("covers the requested HTML, CSS, and JavaScript foundations", () => {
    expect(courseCoverage.html.data).toContain("table");
    expect(courseCoverage.html.accessibility).toContain("aria-label");
    expect(courseCoverage.css.layout).toContain("Flexbox");
    expect(courseCoverage.css.visual).toContain("@keyframes");
    expect(courseCoverage.css.quality).toContain("prefers-reduced-motion");
    expect(courseCoverage.javascript.language).toContain("objects");
    expect(courseCoverage.javascript.async).toContain("fetch");
    expect(courseCoverage.javascript.architecture).toContain("testing");
  });

  it("defines a four-stage path with all course ids represented", () => {
    expect(learningPath.map((stage) => stage.stage)).toEqual([1, 2, 3, 4]);
    expect(learningPath.map((stage) => stage.courseId)).toEqual(["python", "html", "css", "javascript"]);
  });
});
