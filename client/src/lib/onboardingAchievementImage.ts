export type OnboardingAchievementImageInput = {
  displayName: string;
  awardedAt: string | Date;
};

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

export function createOnboardingAchievementSvg(input: OnboardingAchievementImageInput) {
  const awardedAt = new Date(input.awardedAt);
  const dateLabel = Number.isNaN(awardedAt.getTime()) ? "" : awardedAt.toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" });
  const name = escapeXml(input.displayName.trim().slice(0, 80) || "CodeCraft суралцагч");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="CodeCraft Academy onboarding achievement">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#17152c"/><stop offset="0.56" stop-color="#2d1a66"/><stop offset="1" stop-color="#6d28d9"/></linearGradient>
    <linearGradient id="badge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5d0fe"/><stop offset="1" stop-color="#c4b5fd"/></linearGradient>
  </defs>
  <rect width="1200" height="630" rx="38" fill="url(#bg)"/>
  <circle cx="1060" cy="84" r="260" fill="#a78bfa" opacity=".12"/><circle cx="1080" cy="590" r="190" fill="#f0abfc" opacity=".1"/>
  <rect x="72" y="66" width="58" height="58" rx="17" fill="#fff" opacity=".96"/><text x="101" y="105" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#17152c">&gt;_</text>
  <text x="148" y="92" font-family="Arial, sans-serif" font-size="22" font-weight="800" letter-spacing="2" fill="#fff">CODECRAFT</text><text x="148" y="116" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="4" fill="#c4b5fd">ACADEMY</text>
  <rect x="72" y="180" width="194" height="42" rx="21" fill="#ddd6fe" opacity=".18"/><text x="95" y="207" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#e9d5ff">АМЖИЛТЫН ТЭМДЭГ</text>
  <text x="72" y="302" font-family="Arial, sans-serif" font-size="56" font-weight="800" fill="#fff">Системтэй танилцсан</text>
  <text x="72" y="357" font-family="Arial, sans-serif" font-size="25" fill="#ddd6fe">${name} CodeCraft Academy-ийн</text><text x="72" y="392" font-family="Arial, sans-serif" font-size="25" fill="#ddd6fe">суралцах орчинтой амжилттай танилцлаа.</text>
  <rect x="72" y="484" width="420" height="2" fill="#c4b5fd" opacity=".45"/><text x="72" y="530" font-family="Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="1" fill="#c4b5fd">${escapeXml(dateLabel)}</text>
  <circle cx="972" cy="340" r="122" fill="url(#badge)"/><circle cx="972" cy="340" r="98" fill="none" stroke="#5b21b6" stroke-width="3" opacity=".36"/><path d="M927 345l30 30 62-75" fill="none" stroke="#3b0764" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><text x="972" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#fff">ОНБОРДИНГ</text>
</svg>`;
}

export function downloadOnboardingAchievementImage(input: OnboardingAchievementImageInput) {
  const blob = new Blob([createOnboardingAchievementSvg(input)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "codecraft-onboarding-achievement.svg";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function shareOnboardingAchievementImage(input: OnboardingAchievementImageInput) {
  const blob = new Blob([createOnboardingAchievementSvg(input)], { type: "image/svg+xml;charset=utf-8" });
  const file = new File([blob], "codecraft-onboarding-achievement.svg", { type: "image/svg+xml" });
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({ title: "CodeCraft Academy · Системтэй танилцсан", text: `${input.displayName} CodeCraft Academy-ийн onboarding амжилтын тэмдэг авлаа.`, files: [file] });
    return "shared" as const;
  }
  downloadOnboardingAchievementImage(input);
  return "downloaded" as const;
}
