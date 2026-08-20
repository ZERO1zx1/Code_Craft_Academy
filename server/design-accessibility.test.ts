import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (...segments: string[]) => readFileSync(resolve(process.cwd(), ...segments), "utf8");

describe("research-led design accessibility contracts", () => {
  const styles = projectFile("client", "src", "index.css");
  const workspace = projectFile("client", "src", "pages", "Workspace.tsx");
  const sidebar = projectFile("client", "src", "components", "ui", "sidebar.tsx");
  const mobileHook = projectFile("client", "src", "hooks", "useMobile.tsx");
  const dashboardLayout = projectFile("client", "src", "components", "DashboardLayout.tsx");
  const teacherDashboard = projectFile("client", "src", "pages", "TeacherDashboard.tsx");

  it("retains a visible focus treatment and honours reduced-motion preferences", () => {
    expect(styles).toContain(".cc-focus");
    expect(styles).toContain("focus-visible:ring-2");
    expect(styles).toContain("@media (prefers-reduced-motion: no-preference)");
  });

  it("keeps primary coding controls keyboard-reachable and announces changed runtime/tutor states", () => {
    expect(workspace).toContain('type="button"');
    expect(workspace).toContain("aria-pressed={language === item}");
    expect(workspace).toContain('aria-live="polite"');
    expect(workspace).toContain('aria-label="Код засварлагч"');
  });

  it("uses a mobile-safe staff canvas instead of retaining desktop flex layout below the breakpoint", () => {
    expect(sidebar).toContain("block min-h-svh w-full md:flex");
    expect(sidebar).toContain("relative flex w-full min-w-0 flex-1 flex-col");
    expect(mobileHook).toContain("function getInitialMobileState()");
    expect(mobileHook).toContain("window.matchMedia(MOBILE_MEDIA_QUERY).matches");
    expect(mobileHook).toContain("window.visualViewport?.width");
    expect(mobileHook).toContain("document.documentElement.clientWidth");
    expect(mobileHook).toContain("window.visualViewport?.addEventListener(\"resize\", onChange)");
    expect(dashboardLayout).toContain('className="relative hidden md:block"');
    expect(dashboardLayout).toContain('aria-label="Удирдлагын цэс нээх"');
    expect(dashboardLayout).toContain("md:hidden");
    expect(dashboardLayout).not.toContain("SidebarTrigger");
    expect(dashboardLayout).toContain('className="w-full min-w-0"');
    expect(dashboardLayout).toContain('className="flex w-full min-w-0 flex-1 flex-col bg-transparent p-4 md:p-6"');
    expect(teacherDashboard).toContain('className="w-full min-w-0 space-y-7 py-3 md:mx-auto md:max-w-7xl"');
  });
});
