import { describe, expect, it } from "vitest";
import { createOnboardingAchievementSvg } from "./onboardingAchievementImage";

describe("onboarding achievement image", () => {
  it("renders the CodeCraft branded SVG with the real learner name and award information", () => {
    const svg = createOnboardingAchievementSvg({ displayName: "Тэмүүлэн & Co", awardedAt: "2026-08-19T00:00:00.000Z" });
    expect(svg).toContain("CODECRAFT");
    expect(svg).toContain("Системтэй танилцсан");
    expect(svg).toContain("Тэмүүлэн &amp; Co");
    expect(svg).toContain("2026");
  });
});
