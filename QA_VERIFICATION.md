# Owner Workflow Verification Notes

## Desktop review — 2026-08-19

The authenticated configured owner session displayed the owner guidance, direct management routes, audit-log action and date filters, invitation panel, and visible Gmail SMTP delivery state. The learner home displayed the three role-specific onboarding steps and the explicit automatic reward explanation for the **“Системтэй танилцсан”** badge. The owner operations page retained the full existing rubric and notification workflows alongside the new connected controls.

The table uses horizontal overflow only within its data container, preserving the broader responsive layout.

## Mobile review — 375px, 2026-08-19

The owner operations workspace stacks the dashboard cards, owner verification map, audit filters, audit table, invitation form, delivery analytics, and rubric form without clipping controls. The audit table stays contained in a horizontally scrollable region while filter inputs remain full-width and keyboard-reachable. The learner home stacks curriculum cards and the onboarding checklist clearly; the reward rule and completion actions remain visible without competing with the primary learning path.

## Branded invitation and onboarding achievement review — 2026-08-20

The automatic staff invitation email now uses the configured CodeCraft Academy logo in a restrained HTML header while retaining a clear one-time acceptance button and a plain-text fallback. The profile renders a data-backed SVG achievement image only after the learner has earned the **“Системтэй танилцсан”** onboarding badge. The image uses the learner's current display name and earned date, exposes native file sharing where supported, and falls back to a direct SVG download.

Desktop and 375px profile reviews confirmed that the existing owner profile, certificate, profile settings, role guidance, and empty-badge states remain correctly ordered and legible. The authenticated verification profile had not yet earned the onboarding badge, so the eligibility-gated achievement image is covered by the browser regression suite rather than being rendered in that live profile.

## Research-led learning-lab redesign review — 2026-08-20

The redesigned authenticated home, curriculum explorer, profile, teacher workspace, and owner operations screen use a consistent CodeCraft learning-lab system: dark grid-backed coding surfaces, a stronger terminal-mark motif, Space Grotesk display typography, compact monospace labels, violet learning accents, and calm high-contrast white work surfaces. The full learner journey retained real progress, course, quiz, AI tutor, profile, badge, and owner-management actions rather than replacing them with static presentation elements.

Desktop and 375px checks confirmed that course navigation, profile actions, invitation controls, audit filters, and owner operations remain reachable. The staff sidebar wrapper now switches to a block layout below the desktop breakpoint, while wide audit and staff tables stay within their own horizontal-scroll containers instead of shrinking the mobile page canvas. The corresponding route regression covers the 375px canvas behavior.

## Workspace and accessibility review — 2026-08-20

The dedicated coding workspace now carries the same dark CodeCraft learning-lab visual language while preserving Python execution, sandboxed HTML/CSS/JavaScript preview, editor reset, lesson return, and AI tutor interactions. At 375px, the language selector wraps, the run action remains visible, the editor retains a usable single-column width, and the preview plus tutor surfaces stack without clipping.

The regression suite explicitly checks the global focus-visible token, reduced-motion guard, live output status, keyboard-supporting editor label, and the mobile-safe sidebar canvas. TypeScript and all 18 suites / 58 tests passed after these additions.
