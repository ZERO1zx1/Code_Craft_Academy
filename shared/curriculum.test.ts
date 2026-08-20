import { describe, expect, it } from "vitest";
import { getLearningPathStatus } from "./curriculum";

describe("learning path progression", () => {
  it("unlocks the first stage and keeps exactly one current stage", () => {
    const statuses = getLearningPathStatus({ python: 68, html: 32, css: 18, javascript: 8 });
    expect(statuses[0]?.unlocked).toBe(true);
    expect(statuses[1]?.unlocked).toBe(true);
    expect(statuses.filter((stage) => stage.current)).toHaveLength(1);
    expect(statuses.find((stage) => stage.current)?.courseId).toBe("html");
  });

  it("locks later stages until the previous course reaches the threshold", () => {
    const statuses = getLearningPathStatus({ python: 40 });
    expect(statuses[0]?.prerequisiteComplete).toBe(true);
    expect(statuses[1]?.unlocked).toBe(false);
    expect(statuses[1]?.prerequisiteComplete).toBe(false);
    expect(statuses.filter((stage) => stage.current)).toHaveLength(1);
    expect(statuses.find((stage) => stage.current)?.courseId).toBe("python");
  });

  it("moves current stage forward when an earlier course is complete", () => {
    const statuses = getLearningPathStatus({ python: 100, html: 100, css: 20, javascript: 0 });
    expect(statuses.filter((stage) => stage.current)).toHaveLength(1);
    expect(statuses.find((stage) => stage.current)?.courseId).toBe("css");
    expect(statuses[3]?.unlocked).toBe(true);
  });
});
