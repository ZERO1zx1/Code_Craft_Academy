// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const mocks = vi.hoisted(() => ({
  startLogin: vi.fn(),
  projectSubmit: vi.fn(),
  preferenceUpdate: vi.fn(),
  publishLesson: vi.fn(),
  createRubric: vi.fn(),
  activateRubric: vi.fn(),
  importRubrics: vi.fn(),
  updateDisplayName: vi.fn(),
  completeOnboarding: vi.fn(),
  createInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
  gradeReportRefetch: vi.fn(async () => ({ data: [] })),
  rubricExportRefetch: vi.fn(async () => ({ data: { format: "codecraft-rubric/v1", exportedAt: "2026-08-18T00:00:00.000Z", templates: [] } })),
  invalidate: vi.fn(),
  authState: { user: { id: 501, name: "Learner" } as { id: number; name: string; displayName?: string | null; role?: string } | null, isAuthenticated: true },
  dashboard: { summary: { learnerCount: 1, pendingReviewCount: 0, averageProgress: 45, averageQuizScore: 80 }, learners: [], submissions: [], weeklyActivity: [] as { date: string; label: string; activeLearners: number; progressSaves: number }[] },
  profile: { name: "Learner", displayName: null as string | null, progress: [], badges: [] as { badge: { slug: string; title: string; description: string }; awardedAt: string }[], certificate: null as { verificationCode: string } | null },
  progress: [] as { courseId: string; progressPercent: number }[],
}));

vi.mock("wouter", async () => {
  const React = await import("react");
  return {
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => React.createElement("a", { href, ...props }, children),
    useRoute: () => [true, { courseId: "python" }],
    useLocation: () => ["/curriculum", () => undefined],
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => mocks.authState }));
vi.mock("@/const", () => ({ startLogin: mocks.startLogin }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("streamdown", () => ({ Streamdown: ({ children }: { children: React.ReactNode }) => children }));
vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});
vi.mock("@/components/DashboardLayout", async () => {
  const React = await import("react");
  return {
    default: ({ children, menuItems = [] }: { children: React.ReactNode; menuItems?: { label: string; path: string }[] }) => React.createElement(
      "main",
      { "data-testid": "teacher-shell" },
      React.createElement("nav", null, menuItems.map((item) => React.createElement("a", { key: item.path, href: item.path }, item.label))),
      children,
    ),
  };
});
vi.mock("@/lib/certificateProfileQr", () => ({
  buildCertificateProfileUrl: (origin: string, profileId: number) => `${origin}/profile/${profileId}`,
  createCertificateProfileQrDataUrl: vi.fn(async () => "data:image/png;base64,qr-test"),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: mocks.invalidate } }, profile: { public: { invalidate: mocks.invalidate } }, projects: { getMine: { invalidate: mocks.invalidate }, attachments: { invalidate: mocks.invalidate }, history: { invalidate: mocks.invalidate }, rubrics: { invalidate: mocks.invalidate } }, notifications: { preferences: { invalidate: mocks.invalidate }, list: { invalidate: mocks.invalidate }, pushSubscription: { invalidate: mocks.invalidate }, deliveryAnalytics: { invalidate: mocks.invalidate } }, teacher: { dashboard: { invalidate: mocks.invalidate }, roleDirectory: { invalidate: mocks.invalidate } }, onboarding: { progress: { invalidate: mocks.invalidate } } }),
    projects: {
      getMine: { useQuery: () => ({ data: undefined }) },
      attachments: { useQuery: () => ({ data: [] }) },
      history: { useQuery: () => ({ data: { versions: [] } }) },
      compareVersions: { useQuery: () => ({ data: undefined, isLoading: false }) },
      rubrics: { useQuery: () => ({ data: [] }) },
      submit: { useMutation: () => ({ mutate: mocks.projectSubmit, isPending: false }) },
      removeAttachment: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    notifications: {
      preferences: { useQuery: () => ({ data: { lessonUpdatesEnabled: 1, quizResultsEnabled: 1, projectFeedbackEnabled: 1, emailEnabled: 0, browserPushEnabled: 0 }, isLoading: false }) },
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      pushConfig: { useQuery: () => ({ data: { enabled: false }, isLoading: false }) },
      pushSubscription: { useQuery: () => ({ data: undefined }) },
      updatePreferences: { useMutation: () => ({ mutate: mocks.preferenceUpdate, isPending: false }) },
      savePushSubscription: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      clearPushSubscription: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      markRead: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      deliveryAnalytics: { useQuery: () => ({ data: { total: 3, read: 2, unread: 1, deliveries: { email: { sent: 1, failed: 0, skipped: 0 }, push: { sent: 1, failed: 0, skipped: 0 } } }, isLoading: false }) },
    },
    teacher: {
      dashboard: { useQuery: () => ({ data: mocks.dashboard, isLoading: false }) },
      roleDirectory: { useQuery: () => ({ data: [], isLoading: false }) },
      gradeReport: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, refetch: mocks.gradeReportRefetch }) },
      exportRubrics: { useQuery: () => ({ data: undefined, isLoading: false, isFetching: false, refetch: mocks.rubricExportRefetch }) },
      publishLesson: { useMutation: () => ({ mutate: mocks.publishLesson, isPending: false }) },
      reviewProject: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      setRole: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      createRubric: { useMutation: () => ({ mutate: mocks.createRubric, isPending: false }) },
      activateRubric: { useMutation: () => ({ mutate: mocks.activateRubric, isPending: false }) },
      importRubrics: { useMutation: () => ({ mutate: mocks.importRubrics, isPending: false }) },
    },
    progress: {
      list: { useQuery: () => ({ data: mocks.progress }) },
      update: { useMutation: () => ({ mutate: vi.fn() }) },
    },
    profile: {
      public: { useQuery: () => ({ data: mocks.profile, isLoading: false }) },
      updateDisplayName: { useMutation: (options: { onSuccess?: () => void }) => ({ mutate: (payload: { displayName: string }) => { mocks.updateDisplayName(payload); mocks.profile.displayName = payload.displayName; options.onSuccess?.(); }, isPending: false, error: null }) },
    },
    onboarding: {
      progress: { useQuery: () => ({ data: { completedTaskIds: [] }, isLoading: false }) },
      complete: { useMutation: () => ({ mutate: mocks.completeOnboarding, isPending: false }) },
    },
    owner: {
      auditLog: { useQuery: () => ({ data: { items: [{ id: 1, action: "invitation_created", metadataJson: "{\"role\":\"reviewer\"}", createdAt: "2026-08-18T00:00:00.000Z", actor: { name: "Owner" } }], total: 1 }, isLoading: false }) },
      invitations: {
        list: { useQuery: () => ({ data: [], isLoading: false }) },
        create: { useMutation: () => ({ mutate: mocks.createInvitation, isPending: false }) },
        revoke: { useMutation: () => ({ mutate: mocks.revokeInvitation, isPending: false }) },
      },
    },
    tutor: { ask: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
  },
}));

import ProjectAssessment from "../client/src/pages/ProjectAssessment";
import Notifications from "../client/src/pages/Notifications";
import TeacherDashboard from "../client/src/pages/TeacherDashboard";
import LearningOperations from "../client/src/pages/LearningOperations";
import Profile from "../client/src/pages/Profile";
import Curriculum from "../client/src/pages/Curriculum";
import Workspace from "../client/src/pages/Workspace";
import Home from "../client/src/pages/Home";
import { RoleGuideCard } from "../client/src/components/RoleGuideCard";

afterEach(() => {
  cleanup();
  mocks.authState = { user: { id: 501, name: "Learner" }, isAuthenticated: true };
  mocks.startLogin.mockReset();
  mocks.projectSubmit.mockReset();
  mocks.preferenceUpdate.mockReset();
  mocks.publishLesson.mockReset();
  mocks.createRubric.mockReset();
  mocks.activateRubric.mockReset();
  mocks.importRubrics.mockReset();
  mocks.updateDisplayName.mockReset();
  mocks.completeOnboarding.mockReset();
  mocks.createInvitation.mockReset();
  mocks.revokeInvitation.mockReset();
  mocks.gradeReportRefetch.mockClear();
  mocks.rubricExportRefetch.mockClear();
  mocks.invalidate.mockReset();
  mocks.profile.displayName = null;
  mocks.profile.badges = [];
  mocks.profile.certificate = null;
  mocks.dashboard.weeklyActivity = [];
});

describe("learning management routes", () => {
  it("gates project submission behind login and sends a real authenticated submission payload", () => {
    mocks.authState = { user: null, isAuthenticated: false };
    const signedOut = render(<ProjectAssessment />);
    expect(screen.getByText("Төслөө хадгалж, багшийн үнэлгээ авахын тулд нэвтэрнэ үү.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Нэвтрэх" }));
    expect(mocks.startLogin).toHaveBeenCalledOnce();
    signedOut.unmount();

    mocks.authState = { user: { id: 501, name: "Learner" }, isAuthenticated: true };
    render(<ProjectAssessment />);
    fireEvent.change(screen.getByLabelText("Кодын сангийн холбоос"), { target: { value: "https://github.com/learner/tracker" } });
    fireEvent.change(screen.getByLabelText(/Хийсэн ажлын тайлбар/), { target: { value: "Task, status, search болон error урсгалыг тусад нь функц болгож хийсэн бодит CLI ажил." } });
    fireEvent.submit(screen.getByRole("button", { name: "Үнэлгээнд илгээх" }).closest("form")!);
    expect(mocks.projectSubmit).toHaveBeenCalledWith(expect.objectContaining({ courseId: "python", projectLessonId: "py-project", repositoryUrl: "https://github.com/learner/tracker" }));
  });

  it("renders learner notification settings and persists a preference toggle", () => {
    render(<Notifications />);
    expect(screen.getByRole("heading", { name: "Мэдэгдэл" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "Шалгалтын үр дүн" }));
    expect(mocks.preferenceUpdate).toHaveBeenCalledWith({ lessonUpdatesEnabled: true, quizResultsEnabled: false, projectFeedbackEnabled: true, emailEnabled: false, browserPushEnabled: false });
    expect(screen.getByText("Одоогоор шинэ мэдэгдэл алга.")).toBeInTheDocument();
  });

  it("enforces the teacher route gate and lets an admin publish a lesson update", () => {
    mocks.authState = { user: { id: 502, name: "Learner", role: "user" }, isAuthenticated: true };
    const learnerView = render(<TeacherDashboard />);
    expect(screen.getByText("Багшийн самбарт хандах эрхгүй байна.")).toBeInTheDocument();
    learnerView.unmount();

    mocks.authState = { user: { id: 503, name: "Teacher", role: "admin" }, isAuthenticated: true };
    mocks.dashboard.weeklyActivity = [
      { date: "2026-08-17", label: "8/17", activeLearners: 2, progressSaves: 4 },
      { date: "2026-08-18", label: "8/18", activeLearners: 3, progressSaves: 6 },
    ];
    render(<TeacherDashboard />);
    expect(screen.getByTestId("teacher-shell")).toBeInTheDocument();
    expect(screen.getByText("Системийн админ")).toBeInTheDocument();
    expect(screen.getByText("Суралцагчийн ахиц ба практик чадварыг хянах")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Дүнгийн CSV тайлан татах" })).toBeInTheDocument();
    expect(screen.getByTestId("weekly-progress-chart")).toBeInTheDocument();
    expect(screen.getByText("Суралцагчдын долоо хоногийн идэвх")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Гарчиг"), { target: { value: "DOM practice нэмэгдлээ" } });
    fireEvent.change(screen.getByLabelText("Тайлбар"), { target: { value: "Шинэ DOM даалгавар болон шалгах алхмуудыг curriculum-д орууллаа." } });
    fireEvent.submit(screen.getByRole("button", { name: "Мэдэгдэл нийтлэх" }).closest("form")!);
    expect(mocks.publishLesson).toHaveBeenCalledWith({ courseId: "python", title: "DOM practice нэмэгдлээ", content: "Шинэ DOM даалгавар болон шалгах алхмуудыг curriculum-д орууллаа." });
  });

  it("lets a learner save a Mongolian display name from profile settings", () => {
    render(<Profile />);
    expect(screen.getByText("Профайлын тохиргоо")).toBeInTheDocument();
    expect(screen.getByText("Суралцагч")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Нэрээ өөрчлөх" }));
    fireEvent.change(screen.getByLabelText("Дэлгэцийн нэр"), { target: { value: "Тэмүүлэн" } });
    fireEvent.click(screen.getByRole("button", { name: "Хадгалах" }));
    expect(mocks.updateDisplayName).toHaveBeenCalledWith({ displayName: "Тэмүүлэн" });
    expect(mocks.invalidate).toHaveBeenCalled();
  });

  it("shows a real shareable onboarding achievement image only for a learner who earned that badge", () => {
    mocks.profile.badges = [{
      badge: { slug: "onboarding-complete", title: "Системтэй танилцсан", description: "Role-aware onboarding completed." },
      awardedAt: "2026-08-19T00:00:00.000Z",
    }];
    render(<Profile />);
    expect(screen.getByRole("img", { name: /Системтэй танилцсан амжилтын зураг/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Зураг хуваалцах" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Зураг татах" })).toBeInTheDocument();
  });

  it("shows a profile-linked QR code on a learner's earned certificate", async () => {
    mocks.profile.certificate = { verificationCode: "CC-VERIFY-2026" };
    render(<Profile />);
    expect(await screen.findByTestId("certificate-profile-qr")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /public profile QR код/ })).toHaveAttribute("src", "data:image/png;base64,qr-test");
  });

  it("keeps the earned onboarding image and both sharing actions available at the 375px mobile width", () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    mocks.profile.badges = [{
      badge: { slug: "onboarding-complete", title: "Системтэй танилцсан", description: "Role-aware onboarding completed." },
      awardedAt: "2026-08-19T00:00:00.000Z",
    }];
    try {
      render(<Profile />);
      expect(screen.getByTestId("onboarding-achievement-share-card")).toBeVisible();
      expect(screen.getByRole("img", { name: /Системтэй танилцсан амжилтын зураг/ })).toBeVisible();
      expect(screen.getByRole("button", { name: "Зураг хуваалцах" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Зураг татах" })).toBeVisible();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });

  it("renders finalized Mongolian curriculum titles instead of prior English-facing headings", () => {
    render(<Curriculum />);
    expect(screen.getByText("Сургалтын замнал · 4 үндсэн курс")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Сурах замналаа өөрөө удирд." })).toBeInTheDocument();
    expect(screen.getByText("Логик сэтгэлгээ ба тооцооллын суурь")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Python — Суурь ойлголтууд" })).toBeInTheDocument();
    expect(screen.getByText("else — бусад тохиолдол")).toBeInTheDocument();
    expect(screen.queryByText("Python — Core foundation")).not.toBeInTheDocument();
  });

  it("renders the translated coding workspace controls", () => {
    render(<Workspace />);
    expect(screen.getByRole("heading", { name: "Санаагаа код болго." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ажиллуулах" })).toBeInTheDocument();
    expect(screen.getByText("Шууд урьдчилан харах")).toBeInTheDocument();
    expect(screen.getByText("AI туслах")).toBeInTheDocument();
  });

  it("renders localized learner-home navigation and four connected actions for every premium course", () => {
    render(<Home />);
    expect(screen.getByText("Миний замнал")).toBeInTheDocument();
    expect(screen.getByText("Хичээлүүд")).toBeInTheDocument();
    expect(screen.getByText("Сургалтын замнал")).toBeInTheDocument();
    expect(screen.getByText("Таг тус бүрийн хичээл")).toBeInTheDocument();
    expect(screen.getByText("4 ЧИГЛЭЛИЙН LIVE LAB")).toBeInTheDocument();
    expect(screen.getByText("4 КУРС · ҮНЭГҮЙ")).toBeInTheDocument();
    expect(screen.getAllByText("ҮНЭГҮЙ")).toHaveLength(4);
    expect(screen.getByTestId("paid-course-policy")).toHaveTextContent("Бусад програмчлалын хэлний хичээл төлбөртэй ангиллаар нэмэгдэнэ.");
    expect(screen.getByTestId("paid-course-policy")).toHaveTextContent("Python, HTML, CSS, JavaScript сургалт, лаборатори, шалгалт, төсөл бүрэн үнэгүй хэвээр байна.");
    expect(screen.getByRole("link", { name: /Python.*Лаборатори нээх/ })).toHaveAttribute("href", "/workspace?course=python");
    expect(screen.getByRole("link", { name: /HTML.*Лаборатори нээх/ })).toHaveAttribute("href", "/workspace?course=html");
    expect(screen.getByRole("link", { name: /CSS.*Лаборатори нээх/ })).toHaveAttribute("href", "/workspace?course=css");
    expect(screen.getByRole("link", { name: /JavaScript.*Лаборатори нээх/ })).toHaveAttribute("href", "/workspace?course=javascript");
    const courseActions = [
      ["Python", "python", "py-if"],
      ["HTML", "html", "html-document"],
      ["CSS", "css", "css-selectors"],
      ["JavaScript", "javascript", "js-values"],
    ] as const;
    courseActions.forEach(([label, courseId, quizLesson]) => {
      expect(screen.getByRole("link", { name: `${label} · хөтөлбөр` })).toHaveAttribute("href", `/curriculum?course=${courseId}`);
      expect(screen.getByRole("link", { name: `${label} · кодын орчин` })).toHaveAttribute("href", `/workspace?course=${courseId}`);
      expect(screen.getByRole("link", { name: `${label} · төсөл` })).toHaveAttribute("href", `/projects/${courseId}`);
      expect(screen.getByRole("link", { name: `${label} · шалгалт` })).toHaveAttribute("href", `/quiz/${courseId}/${quizLesson}`);
    });
    expect(screen.getByRole("heading", { name: "Эхний алхмууд" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Дууссан гэж тэмдэглэх" })[0]);
    expect(mocks.completeOnboarding).toHaveBeenCalledWith({ taskId: "profile-finish" });
  });

  it("gives the owner direct navigation to management and owner-only operations", () => {
    mocks.authState = { user: { id: 505, name: "Owner", role: "owner" }, isAuthenticated: true };
    const homeView = render(<Home />);
    expect(screen.getByRole("link", { name: "Удирдлагын самбар" })).toHaveAttribute("href", "/teacher");
    expect(screen.getAllByRole("link", { name: "Эзэмшигчийн төв" })[0]).toHaveAttribute("href", "/teacher/operations");
    homeView.unmount();

    render(<TeacherDashboard />);
    expect(screen.getByRole("link", { name: "Эзэмшигчийн төв" })).toHaveAttribute("href", "/teacher/operations");
  });

  it("keeps the base staff canvas shrinkable when wide tables render at 375px", () => {
    const originalWidth = window.innerWidth;
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn().mockReturnValue({ matches: true, media: "(max-width: 767px)", addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
    mocks.authState = { user: { id: 505, name: "Owner", role: "owner" }, isAuthenticated: true };
    try {
      render(<SidebarProvider data-testid="staff-mobile-wrapper"><SidebarInset data-testid="staff-mobile-canvas"><table className="min-w-[620px]"><tbody><tr><td>Өргөн staff хүснэгт</td></tr></tbody></table></SidebarInset></SidebarProvider>);
      expect(screen.getByTestId("staff-mobile-wrapper")).toHaveClass("block", "md:flex");
      expect(screen.getByTestId("staff-mobile-canvas")).toHaveClass("w-full", "min-w-0");
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
      if (originalMatchMedia) Object.defineProperty(window, "matchMedia", { configurable: true, value: originalMatchMedia }); else Reflect.deleteProperty(window, "matchMedia");
    }
  });

  it("explains allowed actions and boundaries for reviewer, teacher, and owner roles", () => {
    const reviewerView = render(<RoleGuideCard role="reviewer" />);
    expect(screen.getByText("Төсөл шалгах")).toBeInTheDocument();
    expect(screen.getByText(/хичээл нийтлэх, rubric-ийн загвар үүсгэх/i)).toBeInTheDocument();
    reviewerView.unmount();

    const teacherView = render(<RoleGuideCard role="teacher" />);
    expect(screen.getByText("Дүнгийн тайлан татах")).toBeInTheDocument();
    expect(screen.getByText(/rubric JSON импорт, экспорт/i)).toBeInTheDocument();
    teacherView.unmount();

    render(<RoleGuideCard role="owner" />);
    expect(screen.getByText("Багийн эрх удирдах")).toBeInTheDocument();
    expect(screen.getByText(/өөр бүртгэлээр нэвтэрсэн бол owner цэс харагдахгүй/i)).toBeInTheDocument();
  });

  it("builds a BOM-prefixed grade CSV with the protected report columns", async () => {
    mocks.authState = { user: { id: 506, name: "Teacher", role: "teacher" }, isAuthenticated: true };
    mocks.gradeReportRefetch.mockResolvedValueOnce({ data: [{ submissionId: 91, courseId: "python", learnerName: "Суралцагч", learnerEmail: "learner@example.test", status: "approved", totalScore: 95, version: 2, submittedAt: "2026-08-18T00:00:00.000Z", reviewedAt: "2026-08-18T01:00:00.000Z" }] } as never);
    const urlWithTestMethods = URL as typeof URL & { createObjectURL?: (blob: Blob) => string; revokeObjectURL?: (url: string) => void };
    const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
    const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
    const createObjectURL = vi.fn((_blob: Blob) => "blob:grade-report");
    const revokeObjectURL = vi.fn((_url: string) => undefined);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    try {
      render(<TeacherDashboard />);
      fireEvent.click(screen.getByRole("button", { name: "Дүнгийн CSV тайлан татах" }));
      await waitFor(() => expect(mocks.gradeReportRefetch).toHaveBeenCalledOnce());
      expect(click).toHaveBeenCalledOnce();
      const blob = createObjectURL.mock.calls[0][0] as Blob;
      expect(Array.from(new Uint8Array(await blob.arrayBuffer()).slice(0, 3))).toEqual([239, 187, 191]);
      expect(await blob.text()).toBe("\"Submission ID\",\"Course\",\"Learner\",\"Email\",\"Status\",\"Score\",\"Version\",\"Submitted at\",\"Reviewed at\"\n\"91\",\"python\",\"Суралцагч\",\"learner@example.test\",\"approved\",\"95\",\"2\",\"2026-08-18T00:00:00.000Z\",\"2026-08-18T01:00:00.000Z\"");
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:grade-report");
    } finally {
      click.mockRestore();
      if (originalCreateObjectURL) Object.defineProperty(URL, "createObjectURL", originalCreateObjectURL); else Reflect.deleteProperty(urlWithTestMethods, "createObjectURL");
      if (originalRevokeObjectURL) Object.defineProperty(URL, "revokeObjectURL", originalRevokeObjectURL); else Reflect.deleteProperty(urlWithTestMethods, "revokeObjectURL");
    }
  });

  it("gates operations from learners and lets staff save a 100-point rubric while viewing delivery analytics", () => {
    mocks.authState = { user: { id: 504, name: "Learner", role: "user" }, isAuthenticated: true };
    const learnerView = render(<LearningOperations />);
    expect(screen.getByText("Сургалтын удирдлагын хэсэгт хандах эрхгүй байна.")).toBeInTheDocument();
    learnerView.unmount();

    mocks.authState = { user: { id: 505, name: "Owner", role: "owner" }, isAuthenticated: true };
    render(<LearningOperations />);
    expect(screen.getByText("Нийт мэдэгдэл")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "JSON экспорт" })).toBeInTheDocument();
    expect(screen.getByText("JSON импорт")).toBeInTheDocument();
    expect(screen.getByText("Системийн үйлдлийн түүх")).toBeInTheDocument();
    expect(screen.getByText("Ажилтан урих")).toBeInTheDocument();
    expect(screen.getByText("Ажилтны урилга үүсгэсэн")).toBeInTheDocument();
    expect(screen.getByLabelText("Үйлдэл")).toBeInTheDocument();
    expect(screen.getByLabelText("Эхлэх огноо")).toBeInTheDocument();
    expect(screen.getByLabelText("Дуусах огноо")).toBeInTheDocument();
    expect(screen.getByText("Эзэмшигчийн эрх идэвхтэй")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Хичээл ба шалгалт/ })).toHaveAttribute("href", "/curriculum");
    expect(screen.getByRole("link", { name: /Кодын орчин/ })).toHaveAttribute("href", "/workspace");
    fireEvent.change(screen.getByLabelText("Нэр"), { target: { value: "Python capstone rubric" } });
    fireEvent.change(screen.getByLabelText("Тайлбар"), { target: { value: "Бодит төслийн чанар, accessibility болон шийдлийн тайлбарыг үнэлнэ." } });
    fireEvent.submit(screen.getByRole("button", { name: "Хадгалж идэвхжүүлэх" }).closest("form")!);
    expect(mocks.createRubric).toHaveBeenCalledWith(expect.objectContaining({ courseId: "python", name: "Python capstone rubric", makeActive: true, criteria: expect.arrayContaining([expect.objectContaining({ maxPoints: 40 })]) }));
  });
});
