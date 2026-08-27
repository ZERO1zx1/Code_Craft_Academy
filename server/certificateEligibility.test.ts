import { describe, expect, it } from "vitest";
import { evaluateCertificateEligibility } from "./certificateEligibility";

describe("certificate eligibility", () => {
  it("requires every published course to be completed and passed", () => {
    const result = evaluateCertificateEligibility({ requiredCourseIds: ["html", "css"], completedCourseIds: ["html", "css"], passedCourseIds: ["html"] });
    expect(result.eligible).toBe(false);
    expect(result.missingQuizIds).toEqual(["css"]);
  });

  it("issues eligibility only when all completion and quiz conditions are met", () => {
    const result = evaluateCertificateEligibility({ requiredCourseIds: ["html", "css"], completedCourseIds: ["html", "css"], passedCourseIds: ["html", "css"] });
    expect(result.eligible).toBe(true);
    expect(result.missingCompletionIds).toEqual([]);
  });
});
