import { useMemo, useState } from "react";
import { BarChart3, BellRing, CheckCircle2, ClipboardCheck, Download, ExternalLink, FileText, GraduationCap, Loader2, Send, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { RoleGuideCard } from "@/components/RoleGuideCard";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const courseNames = { python: "Python", html: "HTML", css: "CSS", javascript: "JavaScript" };
const roleNames = { user: "Суралцагч", reviewer: "Шалгагч", teacher: "Багш", admin: "Системийн админ", owner: "Платформын эзэмшигч" };
const reviewStatuses = { approved: "Баталгаажсан", needs_revision: "Засвар шаардлагатай", submitted: "Илгээсэн" };
const weeklyProgressChartConfig = {
  activeLearners: { label: "Идэвхтэй суралцагч", color: "#8b5cf6" },
  progressSaves: { label: "Ахиц хадгалалт", color: "#06b6d4" },
} satisfies ChartConfig;

function GradeReportDownload() {
  const { user } = useAuth();
  const canDownload = user?.role === "owner" || user?.role === "admin" || user?.role === "teacher";
  const gradeReportQuery = trpc.teacher.gradeReport.useQuery(undefined, { enabled: false });
  if (!canDownload) return null;

  const download = async () => {
    const result = await gradeReportQuery.refetch();
    if (!result.data) {
      toast.error("Дүнгийн тайланг бэлдэх боломжгүй байна.");
      return;
    }
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
    const header = ["Submission ID", "Course", "Learner", "Email", "Status", "Score", "Version", "Submitted at", "Reviewed at"];
    const rows = result.data.map((row) => [row.submissionId, row.courseId, row.learnerName, row.learnerEmail, row.status, row.totalScore ?? "", row.version, row.submittedAt ? new Date(row.submittedAt).toISOString() : "", row.reviewedAt ? new Date(row.reviewedAt).toISOString() : ""]);
    const csv = [header, ...rows].map((row) => row.map(quote).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "codecraft-grade-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Дүнгийн CSV тайлан татагдлаа.");
  };

  return <div className="flex justify-end"><Button type="button" size="sm" variant="outline" onClick={() => void download()} disabled={gradeReportQuery.isFetching}><Download size={14} />Дүнгийн CSV тайлан татах</Button></div>;
}

function TeacherDashboardContent() {
  const { user } = useAuth();
  const role = user?.role;
  const canReview = role === "owner" || role === "admin" || role === "teacher" || role === "reviewer";
  const canPublish = role === "owner" || role === "admin" || role === "teacher";
  const canManageRoles = role === "owner";
  const utils = trpc.useUtils();
  const dashboardQuery = trpc.teacher.dashboard.useQuery(undefined, { enabled: canReview });
  const roleDirectoryQuery = trpc.teacher.roleDirectory.useQuery(undefined, { enabled: canManageRoles });
  const [courseId, setCourseId] = useState<keyof typeof courseNames>("python");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"approved" | "needs_revision">("approved");
  const [scores, setScores] = useState({ functionalityScore: 0, codeQualityScore: 0, userExperienceScore: 0, completenessScore: 0 });

  const selectedEntry = useMemo(() => dashboardQuery.data?.submissions.find((entry) => entry.submission.id === reviewingId), [dashboardQuery.data?.submissions, reviewingId]);
  const publishLesson = trpc.teacher.publishLesson.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.delivered} суралцагчид шинэ хичээлийн мэдэгдэл илгээлээ.`);
      setLessonTitle("");
      setLessonContent("");
    },
    onError: (error) => toast.error(error.message || "Шинэ хичээлийн мэдэгдэл нийтлэх боломжгүй байна."),
  });
  const reviewProject = trpc.teacher.reviewProject.useMutation({
    onSuccess: async () => {
      toast.success("Үнэлгээг хадгалж, суралцагчид мэдэгдэл үүслээ.");
      await utils.teacher.dashboard.invalidate();
      setReviewingId(null);
      setFeedback("");
    },
    onError: (error) => toast.error(error.message || "Төслийн үнэлгээг хадгалах боломжгүй байна."),
  });
  const setRole = trpc.teacher.setRole.useMutation({
    onSuccess: async () => {
      toast.success("Хэрэглэгчийн дүрийн эрх шинэчлэгдлээ.");
      await utils.teacher.roleDirectory.invalidate();
    },
    onError: (error) => toast.error(error.message || "Дүрийн эрх шинэчлэх боломжгүй байна."),
  });

  if (!canReview) return <div className="mx-auto max-w-xl p-10 text-center"><GraduationCap className="mx-auto text-violet-600" /><h1 className="mt-4 text-2xl font-bold">Багшийн самбарт хандах эрхгүй байна.</h1><p className="mt-3 text-sm leading-6 text-slate-500">Энэ хэсгийг зөвхөн шалгагч, багш, системийн админ, эсвэл эзэмшигч ашиглана.</p></div>;
  if (dashboardQuery.isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-violet-600" /></div>;
  if (!dashboardQuery.data) return <div className="p-8 text-sm text-slate-500">Самбарын өгөгдлийг ачаалж чадсангүй.</div>;

  const dashboard = dashboardQuery.data;
  const weeklyActivity = dashboard.weeklyActivity ?? [];
  const total = scores.functionalityScore + scores.codeQualityScore + scores.userExperienceScore + scores.completenessScore;
  const beginReview = (entry: typeof dashboard.submissions[number]) => {
    const submission = entry.submission;
    setReviewingId(submission.id);
    setScores({ functionalityScore: submission.functionalityScore ?? 0, codeQualityScore: submission.codeQualityScore ?? 0, userExperienceScore: submission.userExperienceScore ?? 0, completenessScore: submission.completenessScore ?? 0 });
    setFeedback(submission.teacherFeedback ?? "");
    setReviewStatus(submission.status === "needs_revision" ? "needs_revision" : "approved");
  };

  return <div className="space-y-7">
    <section className="cc-lab-grid relative overflow-hidden rounded-[1.75rem] bg-[#111126] px-6 py-7 text-white shadow-[0_20px_50px_rgba(27,18,71,0.18)] md:px-8 md:py-9">
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div><p className="cc-mono-label text-[10px] text-violet-300">СУРГАЛТЫН УДИРДЛАГА</p><h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-white">Суралцагчийн ахиц ба практик чадварыг хянах</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Суралцагчийн бодит ахиц, шалгалтын үр дүн, төслийн үнэлгээг нэг дороос хянаж, дараагийн хичээлийн мэдэгдлийг нийтлээрэй.</p></div>
        <span className="rounded-full border border-violet-300/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-100">{roleNames[role ?? "user"]} · {user?.displayName ?? user?.name ?? "Хэрэглэгч"}</span>
      </div>
    </section>
    <GradeReportDownload />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: "Суралцагч", value: dashboard.summary.learnerCount, icon: Users, tone: "bg-violet-100 text-violet-700" },
      { label: "Хянах төсөл", value: dashboard.summary.pendingReviewCount, icon: ClipboardCheck, tone: "bg-orange-100 text-orange-700" },
      { label: "Дундаж ахиц", value: `${dashboard.summary.averageProgress}%`, icon: BarChart3, tone: "bg-sky-100 text-sky-700" },
      { label: "Дундаж шалгалтын оноо", value: `${dashboard.summary.averageQuizScore}%`, icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
    ].map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}><stat.icon size={18} /></div><p className="mt-5 text-2xl font-bold">{stat.value}</p><p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{stat.label}</p></div>)}</section>
    <section data-testid="weekly-progress-chart" className="overflow-hidden rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="cc-mono-label text-[10px] text-violet-600">7 ӨДРИЙН TREND</p><h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-slate-950">Суралцагчдын долоо хоногийн идэвх</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Курсийн ахиц хадгалсан болон шалгалт өгсөн бодит суралцагчдын өдөр тутмын идэвхийг харуулна.</p></div><span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">Сүүлийн 7 өдөр</span></div>{weeklyActivity.length ? <ChartContainer config={weeklyProgressChartConfig} className="mt-6 h-[230px] w-full aspect-auto"><AreaChart accessibilityLayer data={weeklyActivity} margin={{ left: -16, right: 8, top: 8 }}><defs><linearGradient id="weekly-active-learners" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--color-activeLearners)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--color-activeLearners)" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={9} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} /><ChartTooltip content={<ChartTooltipContent indicator="line" />} /><Area dataKey="activeLearners" type="monotone" stroke="var(--color-activeLearners)" strokeWidth={3} fill="url(#weekly-active-learners)" /><Area dataKey="progressSaves" type="monotone" stroke="var(--color-progressSaves)" strokeWidth={2} fill="transparent" /></AreaChart></ChartContainer> : <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Сүүлийн 7 өдөрт хянахуйц ахицын үйл явдал алга байна.</div>}</section>
    <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Суралцагчийн явц</h2><p className="mt-1 text-sm text-slate-500">Ахиц болон сүүлийн шалгалтын бодит мэдээлэл.</p></div><Users className="text-violet-600" size={20} /></div>{dashboard.learners.length ? <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b text-xs uppercase tracking-[0.1em] text-slate-400"><th className="pb-3 font-semibold">Суралцагч</th><th className="pb-3 font-semibold">Ахиц</th><th className="pb-3 font-semibold">Шалгалтын оноо</th><th className="pb-3 font-semibold">Сүүлийн үр дүн</th></tr></thead><tbody>{dashboard.learners.map((learner) => <tr key={learner.id} className="border-b border-slate-100 last:border-0"><td className="py-4"><p className="text-sm font-semibold">{learner.name ?? "Нэргүй суралцагч"}</p><p className="mt-1 text-xs text-slate-400">{learner.email ?? "И-мэйл бүртгэгдээгүй"}</p></td><td className="py-4 text-sm font-bold text-violet-700">{learner.averageProgress}%</td><td className="py-4 text-sm font-bold">{learner.averageQuizScore === null ? "—" : `${learner.averageQuizScore}%`}</td><td className="py-4 text-xs text-slate-500">{learner.latestQuiz ? `${learner.latestQuiz.lessonId} · ${new Date(learner.latestQuiz.submittedAt).toLocaleDateString()}` : "Одоогоор шалгалтын оролдлого алга"}</td></tr>)}</tbody></table></div> : <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-500">Одоогоор бүртгэгдсэн суралцагчийн явц алга байна.</div>}</div>
      {canPublish ? <form className="rounded-2xl border border-violet-200 bg-violet-50 p-6" onSubmit={(event) => { event.preventDefault(); publishLesson.mutate({ courseId, title: lessonTitle, content: lessonContent }); }}><div className="flex items-center gap-2 text-violet-700"><BellRing size={18} /><h2 className="font-bold">Шинэ хичээлийн мэдэгдэл</h2></div><p className="mt-2 text-xs leading-5 text-slate-600">Суралцагчийн зөвшөөрсөн дотоод, и-мэйл, хөтчийн шууд мэдэгдлийн сувгаар түгээх хичээлийн мэдээлэл.</p><div className="mt-5 space-y-4"><div className="space-y-2"><Label htmlFor="course">Курс</Label><Select value={courseId} onValueChange={(value) => setCourseId(value as keyof typeof courseNames)}><SelectTrigger id="course" className="bg-white"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(courseNames).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="lesson-title">Гарчиг</Label><Input id="lesson-title" value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} minLength={5} maxLength={160} required className="bg-white" /></div><div className="space-y-2"><Label htmlFor="lesson-content">Тайлбар</Label><Textarea id="lesson-content" value={lessonContent} onChange={(event) => setLessonContent(event.target.value)} minLength={12} maxLength={2000} required className="min-h-28 bg-white" /></div><Button disabled={publishLesson.isPending} className="w-full bg-slate-950 hover:bg-violet-700">{publishLesson.isPending ? <Loader2 className="animate-spin" /> : <Send size={15} />}Мэдэгдэл нийтлэх</Button></div></form> : <aside className="rounded-2xl border border-sky-200 bg-sky-50 p-6"><ShieldCheck className="text-sky-700" /><h2 className="mt-4 font-bold text-sky-950">Шалгагчийн эрх</h2><p className="mt-2 text-sm leading-6 text-sky-800">Та төслийг үнэлэх, санал зөвлөмж бичих, хавсаргасан файлыг харах эрхтэй. Хичээлийн мэдэгдэл нийтлэх болон хэрэглэгчийн дүр удирдах эрх танд байхгүй.</p></aside>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div><h2 className="text-lg font-bold">Төслийн үнэлгээ</h2><p className="mt-1 text-sm text-slate-500">Кодын сан, туршилтын холбоос, тайлбар, хавсаргасан материал болон үнэлгээний шалгуураар практик чадварыг дүгнэнэ.</p></div>{dashboard.submissions.length ? <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]"><div className="space-y-3">{dashboard.submissions.map((entry) => <article key={entry.submission.id} className={`rounded-xl border p-4 ${reviewingId === entry.submission.id ? "border-violet-300 bg-violet-50" : "border-slate-200"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold">{courseNames[entry.submission.courseId as keyof typeof courseNames]} · {entry.learner.name ?? "Нэргүй суралцагч"}</p><p className="mt-1 text-xs text-slate-400">Илгээсэн: {new Date(entry.submission.submittedAt).toLocaleString()}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{reviewStatuses[entry.submission.status as keyof typeof reviewStatuses] ?? "Илгээсэн"}</span></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{entry.submission.summary}</p><div className="mt-3 flex flex-wrap gap-2">{entry.attachments.map((attachment) => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-violet-700"><FileText size={12} />{attachment.fileName}</a>)}</div><div className="mt-4 flex flex-wrap items-center gap-3"><a href={entry.submission.repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-violet-700">Кодын сан <ExternalLink size={13} /></a><Button size="sm" variant="outline" onClick={() => beginReview(entry)}>Үнэлэх</Button></div></article>)}</div><aside className="rounded-xl border border-slate-200 bg-slate-50 p-5">{selectedEntry ? <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); reviewProject.mutate({ submissionId: selectedEntry.submission.id, status: reviewStatus, ...scores, teacherFeedback: feedback }); }}><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">ҮНЭЛГЭЭНИЙ ШАЛГУУР</p><h3 className="mt-1 font-bold">{courseNames[selectedEntry.submission.courseId as keyof typeof courseNames]} төслийн үнэлгээ</h3></div>{([ ["functionalityScore", "Ажиллагаа", 40], ["codeQualityScore", "Кодын чанар", 25], ["userExperienceScore", "Хэрэглэгчийн туршлага ба хүртээмж", 20], ["completenessScore", "Гүйцэтгэл", 15] ] as const).map(([key, label, max]) => <div key={key} className="space-y-1.5"><Label htmlFor={key}>{label} <span className="text-slate-400">/ {max}</span></Label><Input id={key} type="number" min={0} max={max} value={scores[key]} onChange={(event) => setScores((current) => ({ ...current, [key]: Number(event.target.value) }))} /></div>)}<div className="rounded-lg bg-white px-3 py-2 text-sm font-bold">Нийт: {total}/100</div><div className="space-y-2"><Label htmlFor="review-status">Төлөв</Label><Select value={reviewStatus} onValueChange={(value) => setReviewStatus(value as "approved" | "needs_revision")}><SelectTrigger id="review-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="approved">Баталгаажсан</SelectItem><SelectItem value="needs_revision">Засвар шаардлагатай</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="teacher-feedback">Багшийн санал зөвлөмж</Label><Textarea id="teacher-feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} minLength={12} required className="min-h-28" /></div><Button disabled={reviewProject.isPending} className="w-full bg-slate-950 hover:bg-violet-700">{reviewProject.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={15} />}Үнэлгээг хадгалах</Button></form> : <div className="py-12 text-center text-sm text-slate-500">Үнэлэх төслийг жагсаалтаас сонгоно уу.</div>}</aside></div> : <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Үнэлгээнд ирсэн төсөл одоогоор алга байна.</div>}</section>
    {canManageRoles && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><ShieldCheck className="text-violet-600" size={20} /><div><h2 className="text-lg font-bold">Ажилтны дүрийн эрхийн удирдлага</h2><p className="mt-1 text-sm text-slate-500">Эзэмшигч нь шалгагч болон багшийн эрхийг тохируулна. Эзэмшигчийн эрхийг энэ самбараас өөрчлөхгүй.</p></div></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b text-xs uppercase tracking-[0.1em] text-slate-400"><th className="pb-3">Хэрэглэгч</th><th className="pb-3">Одоогийн эрх</th><th className="pb-3">Шинэ эрх</th></tr></thead><tbody>{roleDirectoryQuery.data?.map((member) => <tr key={member.id} className="border-b border-slate-100 last:border-0"><td className="py-4"><p className="text-sm font-semibold">{member.name ?? "Нэргүй хэрэглэгч"}</p><p className="mt-1 text-xs text-slate-400">{member.email}</p></td><td className="py-4 text-sm">{roleNames[member.role as keyof typeof roleNames] ?? member.role}</td><td className="py-4">{member.role === "owner" ? <span className="text-xs text-slate-400">Эзэмшигчийн эрхийг энд өөрчлөхгүй.</span> : <Select value={member.role} onValueChange={(value) => setRole.mutate({ userId: member.id, role: value as "user" | "reviewer" | "teacher" })}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">Суралцагч</SelectItem><SelectItem value="reviewer">Шалгагч</SelectItem><SelectItem value="teacher">Багш</SelectItem></SelectContent></Select>}</td></tr>)}</tbody></table></div></section>}
  </div>;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const menuItems = [
    { icon: BarChart3, label: "Удирдлага", path: "/teacher" },
    ...(user?.role === "owner" ? [{ icon: ShieldCheck, label: "Эзэмшигчийн төв", path: "/teacher/operations" }] : []),
    { icon: GraduationCap, label: "Суралцагчийн самбар", path: "/" },
    { icon: BellRing, label: "Мэдэгдэл", path: "/notifications" },
  ];
  return <DashboardLayout title="Багшийн самбар" menuItems={menuItems}><div className="w-full min-w-0 space-y-7 py-3 md:mx-auto md:max-w-7xl"><RoleGuideCard role={user?.role} /><TeacherDashboardContent /></div></DashboardLayout>;
}
