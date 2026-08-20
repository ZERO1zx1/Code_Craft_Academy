import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  Check,
  ChevronRight,
  Code2,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Play,
  Sparkles,
  TerminalSquare,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { RoleGuideCard, getRoleGuide } from "@/components/RoleGuideCard";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";

const courseMeta = [
  {
    id: "python",
    label: "Python",
    eyebrow: "Суурь ойлголтууд",
    title: "Python-оо бодитоор ойлго",
    description: "Keyword бүрийг цээжлэх бус, кодын урсгалыг уншиж сэтгэх дадлыг бий болгоно.",
    lessons: "PDF сургалтын хөтөлбөр",
    icon: Code2,
    color: "violet",
    next: "elif ба нөхцөлийн дараалал",
    quizLesson: "py-if",
  },
  {
    id: "html",
    label: "HTML",
    eyebrow: "Вэбийн бүтэц",
    title: "Вэбийн суурийг зөв байгуул",
    description: "Semantic бүтэц, бүх чухал tag, accessibility болон бодит page бүтээнэ.",
    lessons: "Таг тус бүрийн хичээл",
    icon: Globe2,
    color: "orange",
    next: "Semantic HTML: main, section, article",
    quizLesson: "html-document",
  },
  {
    id: "css",
    label: "CSS",
    eyebrow: "Харагдацын систем",
    title: "Дизайныг код болгон бүтээ",
    description: "Layout, responsive систем, animation, design token-оор UI-г системтэй зурна.",
    lessons: "Дасан зохицох загварын дадлага",
    icon: LayoutDashboard,
    color: "sky",
    next: "Flexbox-оор responsive card grid хийх",
    quizLesson: "css-selectors",
  },
  {
    id: "javascript",
    label: "JavaScript",
    eyebrow: "Вэбийн үйлдэл",
    title: "Интерактив вэбийг амилуул",
    description: "DOM, event, async/API, module болон жижиг бүтээгдэхүүнээр сурна.",
    lessons: "Ажиллах орчны төслүүд",
    icon: TerminalSquare,
    color: "yellow",
    next: "Event listener ба UI state",
    quizLesson: "js-values",
  },
] as const;

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const progressQuery = trpc.progress.list.useQuery(undefined, { enabled: isAuthenticated });
  const profileQuery = trpc.profile.public.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: Boolean(user?.id) },
  );
  const [activeCourse, setActiveCourse] = useState("python");
  const [mobileOpen, setMobileOpen] = useState(false);
  const progress = useMemo(
    () => Object.fromEntries((progressQuery.data ?? []).map((row) => [row.courseId, row.progressPercent])),
    [progressQuery.data],
  );
  const course = useMemo(
    () => courseMeta.find((item) => item.id === activeCourse) ?? courseMeta[0],
    [activeCourse],
  );
  const CourseIcon = course.icon;
  const overall = Math.round(
    courseMeta.reduce((sum, item) => sum + Number(progress[item.id] ?? 0), 0) / courseMeta.length,
  );
  const profileName = user?.displayName ?? user?.name;
  const displayName = profileName?.split(" ")[0] ?? "суралцагч";
  const roleGuide = getRoleGuide(user?.role);
  const earnedBadges = profileQuery.data?.badges ?? [];
  const canUseStaffWorkspace = ["owner", "admin", "teacher", "reviewer"].includes(user?.role ?? "user");
  const isOwner = user?.role === "owner";

  useEffect(() => {
    const token = window.sessionStorage.getItem("codecraft-pending-invitation");
    if (isAuthenticated && token && window.location.pathname === "/") window.location.assign(`/invite/accept?token=${encodeURIComponent(token)}`);
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-[#f7f7fc] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-white/80 bg-[#f7f7fc]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              className="cc-focus rounded-xl p-2 text-slate-500 lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Цэс нээх"
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-violet-500 to-indigo-700 text-white shadow-[0_8px_20px_rgba(91,60,180,0.28)]">
              <span className="font-mono text-lg font-bold">&gt;_</span>
            </div>
            <div>
              <p className="cc-display text-[16px] font-bold tracking-tight">CodeCraft</p>
              <p className="cc-mono-label text-[9px] text-violet-600">Academy</p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 p-1.5 text-sm font-medium text-slate-500 shadow-sm lg:flex">
            <a className="rounded-xl bg-[#16152d] px-3 py-2 text-white shadow-sm" href="#dashboard">Миний замнал</a>
            <a href="/curriculum" className="transition hover:text-slate-950">Хичээлүүд</a>
            <a href="/workspace" className="transition hover:text-slate-950">Кодын орчин</a>
            {canUseStaffWorkspace ? <a href="/teacher" className="transition hover:text-slate-950">Удирдлагын самбар</a> : null}
            {isOwner ? <a href="/teacher/operations" className="font-semibold text-violet-700 transition hover:text-violet-950">Эзэмшигчийн төв</a> : null}
          </nav>

          <div className="flex items-center gap-3">
            {!isAuthenticated && !authLoading ? (
              <Button onClick={() => startLogin()} className="rounded-xl bg-slate-950 text-xs hover:bg-violet-700">
                Нэвтрэх
              </Button>
            ) : (
              <a href={user?.id ? `/profile/${user.id}` : "/profile"} className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-bold">{profileName ?? "Суралцагч"}</p>
                  <p className="text-[10px] text-slate-400">{roleGuide.title}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffdfc5] text-sm font-bold text-[#8e4c21]">
                  {(profileName ?? "С").slice(0, 1).toUpperCase()}
                </div>
              </a>
            )}
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-[76px] z-20 border-b border-slate-200 bg-white p-5 shadow-xl lg:hidden">
          <div className="grid gap-3 text-sm font-semibold">
            <a href="#dashboard" onClick={() => setMobileOpen(false)}>Миний замнал</a>
            <a href="/curriculum" onClick={() => setMobileOpen(false)}>Хичээлүүд</a>
            <a href="/workspace" onClick={() => setMobileOpen(false)}>Кодын орчин</a>
            {canUseStaffWorkspace ? <a href="/teacher" onClick={() => setMobileOpen(false)}>Удирдлагын самбар</a> : null}
            {isOwner ? <a href="/teacher/operations" onClick={() => setMobileOpen(false)} className="text-violet-700">Эзэмшигчийн төв</a> : null}
          </div>
        </div>
      )}

      <main id="dashboard" className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-12">
        <section className="grid gap-7 xl:grid-cols-[1fr_330px]">
          <div>
            <div className="mb-9 flex items-end justify-between gap-4">
              <div>
                <p className="cc-mono-label mb-2 text-[10px] text-violet-600">
                  {isAuthenticated ? `Сайн байна уу, ${displayName}` : "CodeCraft Academy"}
                </p>
                <h1 className="cc-display text-[34px] font-bold text-slate-950 sm:text-[45px]">Өнөөдөр юу бүтээх вэ?</h1>
                <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-500">
                  {isAuthenticated
                    ? "Сурах замналаа хадгалагдсан бодит ахицаар үргэлжлүүлээрэй."
                    : "Нэвтэрч орсноор ахиц, амжилтын тэмдэг, сертификатаа хадгалж эхлээрэй."}
                </p>
              </div>
              <Button
                onClick={() => isAuthenticated ? (window.location.href = "/workspace") : startLogin()}
                className="hidden h-11 rounded-xl bg-[#16152d] px-5 text-sm shadow-lg shadow-violet-950/15 hover:bg-violet-700 sm:flex"
              >
                <Play size={15} fill="currentColor" />
                {isAuthenticated ? "Үргэлжлүүлэх" : "Эхлэх"}
              </Button>
            </div>

            <div className="cc-lab-grid relative overflow-hidden rounded-[28px] bg-[#15142b] p-7 text-white shadow-[0_22px_50px_rgba(35,29,77,0.2)] sm:p-9">
              <div className="absolute -right-14 -top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-2xl" />
              <div className="relative z-10 max-w-2xl">
                <div className="mb-6 flex items-center gap-2">
                  <span className="cc-mono-label rounded-full border border-violet-300/15 bg-white/10 px-3 py-1.5 text-[9px] text-violet-200">
                    {isAuthenticated ? "ТАНЫ ДАРААГИЙН ХИЧЭЭЛ" : "СУРГАЛТЫН ЗАМНАЛ"}
                  </span>
                  <span className="text-[11px] text-white/45">AI туслах + кодын орчин</span>
                </div>
                <h2 className="cc-display max-w-lg text-[29px] font-bold leading-tight sm:text-[36px]">
                  {course.label}-ийн<br />{course.next}.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/55">
                  Жишээ кодоо кодын орчинд ажиллуулаад, гацсан үедээ AI туслахаас алхамчилсан чиглэл аваарай.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button onClick={() => (window.location.href = "/workspace")} className="h-11 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-black/10 hover:bg-violet-50">
                    <Play size={15} fill="currentColor" /> Кодын орчин нээх
                  </Button>
                  <a href="/curriculum" className="flex items-center gap-2 px-3 text-sm font-semibold text-white/70 transition hover:text-white">
                    Хичээлийн хөтөлбөр <ArrowRight size={15} />
                  </a>
                </div>
              </div>
              <div className="absolute bottom-6 right-7 hidden font-mono text-[92px] font-bold leading-none text-white/[0.035]">
                {course.id === "python" ? "if" : "<>"}
              </div>
            </div>

            <div className="mt-10 flex items-end justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="cc-display text-xl font-bold tracking-tight">Сургалтын замнал</h2><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-emerald-700">4 КУРС · ҮНЭГҮЙ</span></div>
                <p className="mt-1 text-sm text-slate-500">Python, HTML, CSS, JavaScript — сууриас бодит төсөл хүртэл бүрэн нээлттэй.</p>
              </div>
              <a href="/curriculum" className="hidden items-center gap-1 text-sm font-semibold text-violet-600 sm:flex">
                Бүгдийг харах <ChevronRight size={16} />
              </a>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {courseMeta.map((item) => {
                const Icon = item.icon;
                const selected = item.id === course.id;
                const value = Number(progress[item.id] ?? 0);
                const colorClass = item.color === "violet"
                  ? "bg-violet-100 text-violet-600"
                  : item.color === "orange"
                    ? "bg-orange-100 text-orange-600"
                    : item.color === "sky"
                      ? "bg-sky-100 text-sky-600"
                      : "bg-yellow-100 text-yellow-600";
                return (
                  <article key={item.id} data-testid={`course-actions-${item.id}`} className={`group relative overflow-hidden rounded-[20px] border bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-xl ${selected ? "border-violet-300 shadow-[0_16px_34px_rgba(124,58,237,0.15)]" : "border-slate-200/80 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"}`}>
                    <button
                      type="button"
                      onClick={() => setActiveCourse(item.id)}
                      aria-pressed={selected}
                      className="cc-focus w-full p-5 text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}><Icon size={19} /></div>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold tracking-[0.08em] text-emerald-700">ҮНЭГҮЙ</span>
                      </div>
                      <h3 className="mt-5 font-bold tracking-tight">
                        {item.label}<span className="ml-2 text-xs font-normal text-slate-400">/ {item.title}</span>
                      </h3>
                      <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{item.description}</p>
                      <div className="mt-5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>{item.lessons}</span><span>{value}%</span>
                      </div>
                      <Progress value={value} className="mt-2 h-1.5 bg-slate-100" />
                      {selected && <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white"><Check size={12} strokeWidth={3} /></span>}
                    </button>
                    <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/70 p-2 text-[11px] font-bold text-slate-600">
                      <a aria-label={`${item.label} · хөтөлбөр`} href={`/curriculum?course=${item.id}`} className="cc-focus rounded-lg px-2 py-2 transition hover:bg-white hover:text-violet-700">Хөтөлбөр</a>
                      <a aria-label={`${item.label} · кодын орчин`} href={`/workspace?course=${item.id}`} className="cc-focus rounded-lg px-2 py-2 transition hover:bg-white hover:text-violet-700">Кодын орчин</a>
                      <a aria-label={`${item.label} · төсөл`} href={`/projects/${item.id}`} className="cc-focus rounded-lg px-2 py-2 transition hover:bg-white hover:text-violet-700">Төсөл</a>
                      <a aria-label={`${item.label} · шалгалт`} href={`/quiz/${item.id}/${item.quizLesson}`} className="cc-focus rounded-lg px-2 py-2 transition hover:bg-white hover:text-violet-700">Шалгалт</a>
                    </div>
                  </article>
                );
              })}
            </div>
            <section data-testid="paid-course-policy" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800"><LockKeyhole size={18} /></div>
                  <div>
                    <p className="cc-mono-label text-[10px] text-amber-800">ДАРААГИЙН ХЭЛНИЙ КУРС</p>
                    <h3 className="mt-1 text-sm font-bold text-slate-950">Бусад програмчлалын хэлний хичээл төлбөртэй ангиллаар нэмэгдэнэ.</h3>
                    <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">Шинэ хэл, хичээлийн агуулга, үнэ болон нэвтрэх эрхийг эзэмшигч баталгаажуулсны дараа л төлбөртэй курс нээгдэнэ. Одоогийн Python, HTML, CSS, JavaScript сургалт, лаборатори, шалгалт, төсөл бүрэн үнэгүй хэвээр байна.</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[10px] font-bold text-amber-800">ТӨЛБӨРТЭЙ · УДАХГҮЙ</span>
              </div>
            </section>
            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-950 p-3 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
              <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-3">
                <p className="cc-mono-label text-[10px] text-violet-200">4 ЧИГЛЭЛИЙН LIVE LAB</p>
                <p className="text-[11px] text-white/50">Хичээлээс шууд кодын орчин руу шилжинэ.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {courseMeta.map((item) => {
                  const Icon = item.icon;
                  return <a key={item.id} href={`/workspace?course=${item.id}`} className="cc-focus group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-white transition hover:-translate-y-0.5 hover:border-violet-300/60 hover:bg-white/[0.12]">
                    <span className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-violet-200 group-hover:bg-violet-500 group-hover:text-white"><Icon size={15} /></span><span><span className="block text-xs font-bold">{item.label}</span><span className="block text-[10px] text-white/50">Лаборатори нээх</span></span></span><ArrowRight size={14} className="text-white/35 transition group-hover:translate-x-0.5 group-hover:text-violet-200" />
                  </a>;
                })}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Таны ахиц</p>
                  <h3 className="mt-2 text-[26px] font-bold tracking-tight">{overall}%</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Sparkles size={21} /></div>
              </div>
              <Progress value={overall} className="mt-6 h-2" />
              <p className="mt-5 text-xs leading-5 text-slate-500">
                {isAuthenticated ? "Энэ хувь таны хадгалагдсан сургалтын ахицаас бодогдсон." : "Нэвтэрсний дараа таны бодит ахиц энд харагдана."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between">
              <div><h3 className="cc-display font-bold tracking-tight">Таны дараагийн алхам</h3><p className="mt-1 text-xs text-slate-400">{course.label} • {course.lessons}</p></div>
                <span className="rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-600">{Number(progress[course.id] ?? 0) ? "ҮРГЭЛЖИЛЖ БАЙНА" : "ЭХЛЭЭГҮЙ"}</span>
              </div>
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-mono text-violet-600 shadow-sm"><CourseIcon size={17} /></div>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{course.next}</p><p className="mt-1 text-[11px] text-slate-400">Кодын орчин, AI туслахтай хамт</p></div>
                </div>
                <Button onClick={() => (window.location.href = `/workspace?course=${course.id}`)} className="mt-4 h-9 w-full rounded-lg bg-slate-950 text-xs hover:bg-violet-700">{course.label} кодын орчин руу очих <ArrowRight size={14} /></Button>
              </div>
            </div>
            <OnboardingChecklist />

            <div className="rounded-2xl border border-violet-100 bg-[#f1edff] p-6">
              <div className="flex items-center gap-2 text-violet-700"><MessageSquareText size={17} /><span className="text-xs font-bold uppercase tracking-[0.13em]">AI туслах</span></div>
              <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight text-slate-950">Гацсан үедээ ганцаараа бүү үлд.</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">Python, HTML, CSS, JavaScript-ийн кодоо тайлбарлуулах, hint авах, алдаагаа өөрөө олох асуулт асуугаарай.</p>
              <a href="/workspace" className="mt-4 flex items-center gap-1 text-xs font-bold text-violet-700">AI туслах нээх <ArrowRight size={14} /></a>
            </div>
            {isAuthenticated ? <RoleGuideCard role={user?.role} compact /> : null}
            {isOwner ? <div className="rounded-2xl border border-violet-200 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.03)]"><p className="text-xs font-bold uppercase tracking-[0.13em] text-violet-600">Эзэмшигчийн шуурхай үйлдэл</p><h3 className="mt-2 text-base font-bold">Платформын ажиллагааг удирдах</h3><p className="mt-2 text-xs leading-5 text-slate-500">Үнэлгээний шалгуур, хэрэглэгчийн эрх, тайлан болон мэдэгдлийн хяналт руу шууд орно.</p><a href="/teacher/operations" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-violet-700">Эзэмшигчийн төв нээх <ArrowRight size={14} /></a></div> : null}
          </aside>
        </section>

        <section className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Олгогдсон амжилтын тэмдэг</h2>
              <p className="mt-1 text-sm text-slate-500">Зөвхөн таны баталгаажсан амжилтууд харагдана.</p>
            </div>
            <a href={user?.id ? `/profile/${user.id}` : "/profile"} className="flex items-center gap-1 text-sm font-semibold text-violet-600">Профайл харах <ChevronRight size={16} /></a>
          </div>
          {earnedBadges.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {earnedBadges.map(({ badge }) => (
                <div key={badge.slug} className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-white p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Award size={19} /></div>
                  <div><p className="text-sm font-bold">{badge.title}</p><p className="mt-1 text-xs text-slate-400">{badge.description}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center">
              <p className="text-sm font-semibold">Одоогоор амжилтын тэмдэг олгогдоогүй байна.</p>
              <p className="mt-2 text-xs text-slate-400">Ахиц нэмэгдэхэд систем шалгуурыг автоматаар үнэлнэ.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1440px] items-center justify-between px-5 pb-8 pt-4 text-[11px] text-slate-400 lg:px-10">
        <p>© 2026 CodeCraft Academy</p>
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1"><UserRound size={13} /> Нэвтрэх эрхтэй сургалт</span>
          <span className="flex items-center gap-1"><Sparkles size={13} /> Хадгалагдсан ахиц</span>
        </div>
      </footer>
    </div>
  );
}
