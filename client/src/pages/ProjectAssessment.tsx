import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleAlert, ExternalLink, FileCode2, FileText, FileUp, GitBranch, ImageIcon, Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { getCourseProject } from "@shared/projects";
import type { Course } from "@shared/curriculum";

const courseIds: Course["id"][] = ["python", "html", "css", "javascript"];
const statusCopy = {
  submitted: { label: "Үнэлгээнд илгээсэн", className: "bg-amber-100 text-amber-800" },
  in_review: { label: "Хянаж байна", className: "bg-sky-100 text-sky-800" },
  needs_revision: { label: "Засвар шаардлагатай", className: "bg-orange-100 text-orange-800" },
  approved: { label: "Баталгаажсан", className: "bg-emerald-100 text-emerald-800" },
} as const;

type Attachment = {
  id: number;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  previewKind: "image" | "pdf" | "text" | "download";
  versionNumber?: number;
};

type SubmissionVersion = {
  id: number;
  versionNumber: number;
  createdAt: Date;
  repositoryUrl: string;
  liveUrl: string | null;
  summary: string;
  attachments: Attachment[];
};

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const [content, setContent] = useState<string>();
  const [loading, setLoading] = useState(false);

  if (attachment.previewKind === "image") {
    return <img src={attachment.url} alt={attachment.fileName} className="mt-3 max-h-72 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain" />;
  }
  if (attachment.previewKind === "pdf") {
    return <iframe title={`${attachment.fileName} урьдчилан харах`} src={attachment.url} className="mt-3 hidden h-72 w-full rounded-lg border border-slate-200 bg-slate-50 sm:block" sandbox="allow-same-origin" />;
  }
  if (attachment.previewKind !== "text") return null;

  const showText = async () => {
    if (content !== undefined) return;
    setLoading(true);
    try {
      setContent((await (await fetch(attachment.url)).text()).slice(0, 30_000));
    } catch {
      setContent("Файлын урьдчилан харах хэсгийг ачаалж чадсангүй.");
    } finally {
      setLoading(false);
    }
  };

  return <>
    <Button type="button" size="sm" variant="outline" className="mt-3" onClick={showText}>
      {loading ? <Loader2 className="animate-spin" /> : <FileCode2 size={14} />}
      Кодыг урьдчилан харах
    </Button>
    {content !== undefined ? <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">{content}</pre> : null}
  </>;
}

function AttachmentCard({ attachment, onRemove, disabled }: { attachment: Attachment; onRemove?: () => void; disabled?: boolean }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="shrink-0 text-violet-600" size={17} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{attachment.fileName}</p>
          <p className="text-xs text-slate-400">{Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB · {attachment.versionNumber ? `Хувилбар ${attachment.versionNumber}` : "Одоогийн хувилбар"}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <a href={attachment.url} target="_blank" rel="noreferrer"><Button type="button" size="sm" variant="outline"><ExternalLink size={14} />Нээх</Button></a>
        {onRemove ? <Button type="button" size="sm" variant="outline" onClick={onRemove} disabled={disabled}><Trash2 size={14} />Устгах</Button> : null}
      </div>
    </div>
    <AttachmentPreview attachment={attachment} />
  </article>;
}

function VersionDiffPanel({ courseId, versions }: { courseId: Course["id"]; versions: SubmissionVersion[] }) {
  const [fromVersion, setFromVersion] = useState(0);
  const [toVersion, setToVersion] = useState(0);
  const defaults = useMemo(() => ({ from: versions[1]?.versionNumber ?? 0, to: versions[0]?.versionNumber ?? 0 }), [versions]);
  const selectedFrom = fromVersion || defaults.from;
  const selectedTo = toVersion || defaults.to;
  const canCompare = Boolean(selectedFrom && selectedTo && selectedFrom !== selectedTo);
  const diffQuery = trpc.projects.compareVersions.useQuery({ courseId, fromVersion: selectedFrom || 1, toVersion: selectedTo || 1 }, { enabled: canCompare });

  if (versions.length < 2) return null;
  const diff = diffQuery.data;
  return <section className="mt-7 rounded-2xl border border-violet-200 bg-violet-50/60 p-6 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2"><GitBranch size={18} className="text-violet-600" /><div><h2 className="font-bold">Хувилбар хоорондын өөрчлөлт</h2><p className="mt-1 text-xs text-slate-500">Тайлбар, холбоос, хавсаргасан файлуудын ялгааг харна.</p></div></div>
      <div className="flex items-center gap-2 text-sm">
        <select aria-label="Эхний хувилбар" value={selectedFrom} onChange={(event) => setFromVersion(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5"><option value={0}>Эхний хувилбар</option>{versions.map((version) => <option key={`from-${version.id}`} value={version.versionNumber}>Хувилбар {version.versionNumber}</option>)}</select>
        <span className="text-slate-400">→</span>
        <select aria-label="Хоёр дахь хувилбар" value={selectedTo} onChange={(event) => setToVersion(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5"><option value={0}>Хоёр дахь хувилбар</option>{versions.map((version) => <option key={`to-${version.id}`} value={version.versionNumber}>Хувилбар {version.versionNumber}</option>)}</select>
      </div>
    </div>
    {diffQuery.isLoading ? <div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16} /> Ялгааг тооцоолж байна…</div> : null}
    {diffQuery.error ? <p className="mt-5 text-sm text-rose-700">{diffQuery.error.message}</p> : null}
    {diff ? <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <article className="rounded-xl border border-emerald-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Нэмэгдсэн</p><ul className="mt-3 space-y-2 text-sm text-slate-700">{diff.fields.repositoryUrlChanged ? <li>Кодын сангийн холбоос шинэчлэгдсэн.</li> : null}{diff.fields.liveUrlChanged ? <li>Ажиллаж буй туршилтын холбоос шинэчлэгдсэн.</li> : null}{diff.fields.summary.added.map((line) => <li key={`add-${line}`} className="rounded bg-emerald-50 px-2 py-1 font-mono text-xs">+ {line}</li>)}{diff.attachments.added.map((attachment) => <li key={`file-add-${attachment.id}`} className="flex items-center gap-2"><FileText size={14} />{attachment.fileName}</li>)}{!diff.fields.repositoryUrlChanged && !diff.fields.liveUrlChanged && !diff.fields.summary.added.length && !diff.attachments.added.length ? <li className="text-slate-400">Нэмэгдсэн өөрчлөлт байхгүй.</li> : null}</ul></article>
      <article className="rounded-xl border border-rose-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-rose-700">Хасагдсан</p><ul className="mt-3 space-y-2 text-sm text-slate-700">{diff.fields.summary.removed.map((line) => <li key={`remove-${line}`} className="rounded bg-rose-50 px-2 py-1 font-mono text-xs">− {line}</li>)}{diff.attachments.removed.map((attachment) => <li key={`file-remove-${attachment.id}`} className="flex items-center gap-2"><FileText size={14} />{attachment.fileName}</li>)}{!diff.fields.summary.removed.length && !diff.attachments.removed.length ? <li className="text-slate-400">Хасагдсан өөрчлөлт байхгүй.</li> : null}</ul></article>
    </div> : null}
    {!diffQuery.isLoading && !diffQuery.error && !diff ? <p className="mt-5 text-sm text-slate-500">Хоёр ялгаатай хувилбар сонгоно уу.</p> : null}
  </section>;
}

export default function ProjectAssessment() {
  const [, params] = useRoute("/projects/:courseId");
  const courseId = courseIds.includes(params?.courseId as Course["id"]) ? params?.courseId as Course["id"] : undefined;
  const project = useMemo(() => courseId ? getCourseProject(courseId) : undefined, [courseId]);
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const submissionQuery = trpc.projects.getMine.useQuery({ courseId: courseId ?? "python" }, { enabled: Boolean(courseId && user) });
  const attachmentQuery = trpc.projects.attachments.useQuery({ courseId: courseId ?? "python" }, { enabled: Boolean(courseId && user) });
  const historyQuery = trpc.projects.history.useQuery({ courseId: courseId ?? "python" }, { enabled: Boolean(courseId && user) });
  const rubricQuery = trpc.projects.rubrics.useQuery({ courseId: courseId ?? "python" }, { enabled: Boolean(courseId && user) });
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const activeRubric = rubricQuery.data?.find((rubric) => rubric.isActive === 1);
  const attachments = (attachmentQuery.data ?? []) as Attachment[];
  const currentSubmission = submissionQuery.data;
  const currentStatus = currentSubmission ? statusCopy[currentSubmission.status] : undefined;

  useEffect(() => {
    if (!submissionQuery.data) return;
    setRepositoryUrl(submissionQuery.data.repositoryUrl);
    setLiveUrl(submissionQuery.data.liveUrl ?? "");
    setSummary(submissionQuery.data.summary);
  }, [submissionQuery.data]);

  const refresh = async () => {
    if (!courseId) return;
    await Promise.all([utils.projects.getMine.invalidate({ courseId }), utils.projects.attachments.invalidate({ courseId }), utils.projects.history.invalidate({ courseId })]);
  };
  const submitMutation = trpc.projects.submit.useMutation({ onSuccess: async () => { toast.success("Төслийг үнэлгээнд илгээлээ."); await refresh(); }, onError: (error) => toast.error(error.message || "Илгээх үед алдаа гарлаа.") });
  const removeMutation = trpc.projects.removeAttachment.useMutation({ onSuccess: refresh, onError: (error) => toast.error(error.message || "Файл устгах боломжгүй байлаа.") });
  const upload = async (files: File[]) => {
    if (!courseId || !project || !files.length) return;
    if (files.some((file) => file.size > 8 * 1024 * 1024)) { toast.error("Файл бүр 8 MB-аас их байж болохгүй."); return; }
    setUploading(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("projectLessonId", project.lessonId);
        const response = await fetch(`/api/projects/${courseId}/attachments`, { method: "POST", body: form, credentials: "include" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || `${file.name} хавсаргах боломжгүй байлаа.`);
      }
      toast.success(`${files.length} файл хавсаргалаа.`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Файл хавсаргах боломжгүй байлаа.");
    } finally {
      setUploading(false);
      setSelectedFileCount(0);
    }
  };

  if (!courseId || !project) return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-xl rounded-2xl border bg-white p-8 text-center"><CircleAlert className="mx-auto text-orange-500" /><h1 className="mt-4 text-xl font-bold">Төсөл олдсонгүй.</h1><Link href="/curriculum" className="mt-5 inline-flex text-sm font-semibold text-violet-700">Сургалтын замнал руу буцах</Link></div></main>;

  return <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 lg:px-8"><Link href="/curriculum" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"><ArrowLeft size={17} /> Сургалтын замнал</Link><Link href="/notifications" className="text-sm font-semibold text-violet-700">Мэдэгдэл</Link></div></header>
    <div className="mx-auto max-w-6xl px-5 py-9 lg:px-8"><div className="grid gap-7 lg:grid-cols-[1fr_360px]">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">КУРС ТӨГСӨХ ТӨСӨЛ</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.045em]">{project.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">{project.summary}</p>
        <div className="mt-7 rounded-2xl bg-[#17152c] p-6 text-white"><div className="flex items-center gap-2 text-violet-200"><Sparkles size={16} /><span className="text-xs font-bold uppercase tracking-[0.14em]">Шаардлага</span></div><ul className="mt-4 space-y-3">{project.requirements.map((requirement) => <li key={requirement} className="flex gap-3 text-sm leading-6 text-white/80"><CheckCircle2 className="mt-0.5 shrink-0 text-violet-300" size={16} />{requirement}</li>)}</ul></div>
        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Илгээлт</h2><p className="mt-1 text-sm text-slate-500">Кодын сан, ажиллаж буй туршилтын холбоос, тайлбар болон олон файл хавсаргана уу.</p></div>{currentStatus ? <span className={`rounded-full px-3 py-1 text-xs font-bold ${currentStatus.className}`}>{currentStatus.label}</span> : null}</div>
          {!isAuthenticated ? <div className="mt-6 rounded-xl bg-violet-50 p-5"><p className="text-sm font-semibold">Төслөө хадгалж, багшийн үнэлгээ авахын тулд нэвтэрнэ үү.</p><Button onClick={startLogin} className="mt-4 bg-slate-950 hover:bg-violet-700">Нэвтрэх</Button></div> : <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); submitMutation.mutate({ courseId, projectLessonId: project.lessonId, repositoryUrl, liveUrl, summary }); }}>
            <div className="space-y-2"><Label htmlFor="repositoryUrl">Кодын сангийн холбоос</Label><Input id="repositoryUrl" type="url" required value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/username/project" /></div>
            <div className="space-y-2"><Label htmlFor="liveUrl">Ажиллаж буй туршилтын холбоос <span className="font-normal text-slate-400">(заавал биш)</span></Label><Input id="liveUrl" type="url" value={liveUrl} onChange={(event) => setLiveUrl(event.target.value)} placeholder="https://your-project.example" /></div>
            <div className="space-y-2"><Label htmlFor="summary">Хийсэн ажлын тайлбар</Label><Textarea id="summary" required minLength={40} value={summary} onChange={(event) => setSummary(event.target.value)} className="min-h-36" /><p className="text-right text-xs text-slate-400">{summary.length}/5000</p></div>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold"><FileUp size={17} className="text-violet-600" />Файлууд хавсаргах <span className="font-normal text-slate-400">(PDF, зураг, код/текст · файл бүр 8 MB)</span></div>
              <Input id="project-file" type="file" multiple accept=".pdf,image/png,image/jpeg,image/webp,image/gif,.py,.js,.ts,.html,.css,.md,.txt,.json" className="sr-only" disabled={uploading} onChange={(event) => { const files = Array.from(event.target.files ?? []); setSelectedFileCount(files.length); void upload(files); event.currentTarget.value = ""; }} />
              <Label htmlFor="project-file" className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold shadow-sm hover:border-violet-300">{uploading ? <Loader2 className="mr-2 animate-spin" size={15} /> : <FileUp className="mr-2" size={15} />}{uploading ? `${selectedFileCount} файлыг хадгалж байна…` : "Файл сонгох"}</Label>
              <p className="mt-2 text-xs leading-5 text-slate-500">Нэг сонголтоор олон файл нэмж болно. Дараагийн илгээлт бүр шинэ хувилбар болон хадгалагдана.</p>
            </div>
            {attachments.length ? <div className="space-y-3">{attachments.map((attachment) => <AttachmentCard key={attachment.id} attachment={attachment} onRemove={() => removeMutation.mutate({ attachmentId: attachment.id })} disabled={removeMutation.isPending} />)}</div> : null}
            <Button disabled={submitMutation.isPending || uploading} className="h-11 bg-slate-950 hover:bg-violet-700">{submitMutation.isPending ? <Loader2 className="animate-spin" /> : <Send size={15} />}{currentSubmission ? "Шинэ хувилбар илгээх" : "Үнэлгээнд илгээх"}</Button>
          </form>}
        </section>
        {historyQuery.data?.versions?.length ? <><VersionDiffPanel courseId={courseId} versions={historyQuery.data.versions as SubmissionVersion[]} /><section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><GitBranch size={18} className="text-violet-600" /><h2 className="font-bold">Илгээлтийн хувилбарын түүх</h2></div><div className="mt-5 space-y-4">{historyQuery.data.versions.map((version) => <article key={version.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">Хувилбар {version.versionNumber}</p><p className="text-xs text-slate-400">{new Date(version.createdAt).toLocaleString()}</p></div><p className="mt-2 text-sm text-slate-600">{version.summary}</p>{version.attachments?.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{version.attachments.map((attachment: Attachment) => <AttachmentCard key={attachment.id} attachment={{ ...attachment, versionNumber: version.versionNumber }} />)}</div> : <p className="mt-3 text-xs text-slate-400">Энэ хувилбарт файл хавсаргаагүй.</p>}</article>)}</div></section></> : null}
        {currentSubmission?.teacherFeedback ? <section className="mt-7 rounded-2xl border border-violet-200 bg-violet-50 p-6"><div className="flex items-center gap-2 text-violet-700"><CheckCircle2 size={18} /><h2 className="font-bold">Багшийн санал, зөвлөмж</h2></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{currentSubmission.teacherFeedback}</p></section> : null}
      </section>
      <aside className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><GitBranch size={17} className="text-violet-600" /><h2 className="font-bold">Үнэлгээний шалгуур</h2></div>{activeRubric ? <><p className="mt-3 text-sm font-semibold text-violet-700">{activeRubric.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{activeRubric.description}</p><div className="mt-5 space-y-4">{activeRubric.criteria.map((criterion) => <div key={criterion.id}><div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{criterion.label}</span><span className="text-slate-400">{criterion.maxPoints}</span></div>{criterion.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{criterion.description}</p> : null}</div>)}</div></> : <div className="mt-5 space-y-4">{Object.entries(project.rubric).map(([key, rubric]) => { const score = currentSubmission ? ({ functionality: currentSubmission.functionalityScore, codeQuality: currentSubmission.codeQualityScore, userExperience: currentSubmission.userExperienceScore, completeness: currentSubmission.completenessScore } as Record<string, number | null>)[key] : null; return <div key={key}><div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{rubric.label}</span><span className="text-slate-400">{score ?? "—"}/{rubric.max}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{rubric.description}</p>{score !== null && score !== undefined ? <Progress value={(score / rubric.max) * 100} className="mt-2 h-1.5" /> : null}</div>; })}</div>}{currentSubmission?.totalScore !== null && currentSubmission?.totalScore !== undefined ? <div className="mt-6 rounded-xl bg-slate-950 p-4 text-white"><p className="text-xs font-semibold text-white/55">НИЙТ ҮНЭЛГЭЭ</p><p className="mt-1 text-3xl font-bold">{currentSubmission.totalScore}<span className="text-sm text-white/50">/100</span></p></div> : null}</section>{currentSubmission?.repositoryUrl ? <a href={currentSubmission.repositoryUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold hover:border-violet-300"><span>Кодын санг нээх</span><ExternalLink size={16} /></a> : null}{attachments.some((attachment) => attachment.previewKind === "image") ? <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm font-bold"><ImageIcon size={16} className="text-violet-600" />Хавсаргасан материал</div><p className="mt-2 text-xs leading-5 text-slate-500">Зураг, PDF болон эх кодын урьдчилан харах хэсгийг илгээлтийн түүхээс харж болно.</p></div> : null}</aside>
    </div></div>
  </main>;
}
