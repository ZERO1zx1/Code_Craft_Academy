/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { normalizeLearningState, readLearningState, resetPortfolioChecklist, togglePortfolioChecklistItem } from "./localLearning";

describe("optional portfolio checklist state", () => {
  it("deduplicates checked portfolio tasks", () => {
    expect(normalizeLearningState({ portfolioChecklistIds: ["readme", "readme"] })).toEqual({ portfolioChecklistIds: ["readme"] });
  });

  it("toggles and resets only the learner's optional portfolio checklist", () => {
    window.localStorage.clear();
    togglePortfolioChecklistItem("profile-readme");
    expect(readLearningState().portfolioChecklistIds).toEqual(["profile-readme"]);
    togglePortfolioChecklistItem("profile-readme");
    expect(readLearningState().portfolioChecklistIds).toEqual([]);
    togglePortfolioChecklistItem("project-readme");
    resetPortfolioChecklist();
    expect(readLearningState()).toEqual({ portfolioChecklistIds: [] });
  });
});
