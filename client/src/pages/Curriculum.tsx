import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Code2, FileCode2, FlaskConical, Layers3, Play, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { curriculum, getLearningPathStatus, lessonDetails, type Course, type LearnerProgress, type Lesson } from "@shared/curriculum";

const icons: Record<Course["id"], typeof Code2> = {
  python: Code2,
  html: FileCode2,
  css: Layers3,
  javascript: FlaskConical,
};

const lessonKindLabel: Record<Lesson["kind"], string> = {
  concept: "Ойлголт",
  practice: "Дадлага",
  quiz: "Шалгалт",
  project: "Төсөл",
};

function LessonRow({ lesson, active, onSelect }: { lesson: Lesson; active: boolean; onSelect: () => void }) {
  const Icon = lesson.kind === "project" ? Sparkles : lesson.kind === "practice" ? Play : CheckCircle2;
  const tone = lesson.kind === "project" ? "bg-orange-100 text-orange-600" : lesson.kind === "practice" ? "bg-sky-100 text-sky-600" : "bg-violet-100 text-violet-600";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-4 border-b border-slate-100 px-4 py-4 text-left transition last:border-0 ${active ? "bg-violet-50/70 shadow-[inset_3px_0_0_#7c3aed]" : "hover:bg-slate-50"}`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={16} /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{lesson.title}</p>
        <p className="mt-1 text-xs text-slate-400">{lesson.duration} · {lessonKindLabel[lesson.kind]}</p>
      </div>
      <span className="shrink-0 text-xs font-medium text-slate-400">{lesson.quizQuestions} асуулт</span>
    </button>
  );
}

export default function Curriculum() {
  const [, setLocation] = useLocation();
  const [activeId, setActiveId] = useState<Course["id"]>(() => {
    const requestedCourse = new URLSearchParams(window.location.search).get("course");
    return curriculum.some((item) => item.id === requestedCourse) ? requestedCourse as Course["id"] : "python";
  });
  const [learnerProgress, setLearnerProgress] = useState<LearnerProgress>({});
  const { user } = useAuth();
  const progressQuery = trpc.progress.list.useQuery(undefined, { enabled: Boolean(user) });
  const progressUpdate = trpc.progress.update.useMutation();

  useEffect(() => {
    if (progressQuery.data) {
      setLearnerProgress(Object.fromEntries(progressQuery.data.map((row: { courseId: string; progressPercent: number }) => [row.courseId as Course["id"], row.progressPercent])) as LearnerProgress);
    }
  }, [progressQuery.data]);

  const course = useMemo(() => curriculum.find((item) => item.id === activeId) ?? curriculum[0], [activeId]);
  const [lessonId, setLessonId] = useState(course.lessons[0].id);
  const lesson = course.lessons.find((item) => item.id === lessonId) ?? course.lessons[0];
  const details = lessonDetails[lesson.id];
  const pathStatus = getLearningPathStatus(learnerProgress);
  const CourseIcon = icons[course.id];
  const isProject = lesson.kind === "project";

  const changeCourse = (id: Course["id"]) => {
    setActiveId(id);
    const next = curriculum.find((item) => item.id === id);
    if (next) setLessonId(next.lessons[0].id);
  };

  const addProgress = (stage: (typeof pathStatus)[number]) => {
    if (!stage.unlocked) return;
    const nextProgress = Math.min(100, (learnerProgress[stage.courseId] ?? 0) + 10);
    setLearnerProgress((current: LearnerProgress) => ({ ...current, [stage.courseId]: nextProgress }));
    if (user) progressUpdate.mutate({ courseId: stage.courseId, progressPercent: nextProgress });
  };

  return (
    <main className="min-h-screen bg-transparent text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"><ArrowLeft size={17} /> Нүүр хуудас</Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/notifications" className="hidden text-xs font-bold text-slate-500 hover:text-violet-700 sm:block">Мэдэгдэл</Link>
            <Link href="/library" className="text-xs font-bold text-slate-500 hover:text-violet-700">Материал унших</Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 font-mono text-xs font-bold text-white shadow-lg shadow-violet-950/20">&gt;_</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-9 lg:px-10 lg:py-12">
        <section className="cc-lab-grid relative overflow-hidden rounded-[1.75rem] bg-[#111126] px-6 py-7 text-white shadow-[0_20px_50px_rgba(27,18,71,0.18)] md:px-8 md:py-9">
          <div className="relative max-w-2xl">
            <p className="cc-mono-label text-[10px] text-violet-300">Сургалтын замнал · 4 үндсэн курс</p>
            <h1 className="cc-display mt-3 text-4xl font-bold tracking-[-0.045em]">Сурах замналаа өөрөө удирд.</h1>
            <p className="mt-4 text-sm leading-7 text-white/65">Хичээл бүр тайлбар, кодын дадлага, AI туслах, олон асуулттай шалгалт болон материалын лавлахтай. Курс бүрийн төгсгөлд бодит төслөө багшид үнэлүүлнэ.</p>
          </div>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-4">
            {pathStatus.map((stage) => (
              <div key={stage.stage} className={`rounded-2xl border p-3 backdrop-blur-sm ${stage.current ? "border-violet-300/70 bg-violet-400/20" : stage.unlocked ? "border-white/10 bg-white/[0.07]" : "border-white/10 bg-white/[0.03] opacity-65"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="cc-mono-label text-[8px] text-white/50">Үе шат {stage.stage} {stage.current ? "· ИДЭВХТЭЙ" : !stage.unlocked ? "· ТҮГЖЭЭТЭЙ" : "· НЭЭЛТТЭЙ"}</span>
                  <span className="text-[10px] font-semibold text-white/55">{stage.progress}%</span>
                </div>
                <p className="mt-2 text-xs font-bold text-white">{stage.title}</p>
                <p className="mt-1 text-[10px] leading-4 text-white/50">{stage.unlocked ? `Дараагийн нээлт: ${stage.unlocks}` : "Нээхийн тулд өмнөх замналаа 60% хүргэнэ."}</p>
                <div className="mt-2 h-1 rounded-full bg-white/10"><div className="h-1 rounded-full bg-violet-300" style={{ width: `${stage.progress}%` }} /></div>
                <button type="button" onClick={() => addProgress(stage)} disabled={!stage.unlocked} className="mt-2 text-[10px] font-bold text-violet-200 transition hover:text-white disabled:cursor-not-allowed disabled:text-white/35">{stage.prerequisiteComplete ? "Ахиц нэмэх" : "Шаардлага хүлээгдэж байна"}</button>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-9 flex gap-2 overflow-x-auto pb-2">
          {curriculum.map((item: Course) => {
            const Icon = icons[item.id];
            return (
              <button key={item.id} type="button" onClick={() => changeCourse(item.id)} className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${activeId === item.id ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-violet-950/15" : "cc-surface text-slate-500 hover:border-violet-200 hover:text-slate-950"}`}>
                <Icon size={16} />{item.title.split(" — ")[0]}
              </button>
            );
          })}
        </div>

        <section className="mt-7 grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="cc-surface overflow-hidden rounded-2xl">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><CourseIcon size={19} /></div>
                <div><h2 className="cc-display font-bold">{course.title}</h2><p className="mt-1 text-xs text-slate-400">{course.lessons.length} хичээл · 1 төсөл</p></div>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">{course.subtitle}</p>
            </div>
            <div>{course.lessons.map((item: Lesson) => <LessonRow key={item.id} lesson={item} active={item.id === lesson.id} onSelect={() => setLessonId(item.id)} />)}</div>
          </aside>

          <article className="cc-surface rounded-2xl p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">{lessonKindLabel[lesson.kind]}</Badge>
              <span className="cc-mono-label text-[9px] text-slate-400">{lesson.duration} · {lesson.quizQuestions} асуулт</span>
            </div>
            <h2 className="cc-display mt-5 text-3xl font-bold tracking-[-0.04em]">{lesson.title}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">{lesson.summary}</p>
            <div className="mt-7 flex flex-wrap gap-2">{lesson.tags.map((tag: string) => <span key={tag} className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] font-medium text-slate-600">{tag}</span>)}</div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="cc-lab-grid relative overflow-hidden rounded-2xl bg-[#17152c] p-5 text-white">
                <div className="relative flex items-center gap-2 text-violet-200"><Code2 size={16} /><span className="cc-mono-label text-[10px]">Жишээ ба дадлага</span></div>
                <pre className="relative mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-white/5 p-3 font-mono text-xs leading-5 text-white/80">{details?.examples[0] ?? "Жишээ удахгүй нэмэгдэнэ."}</pre>
                <p className="relative mt-4 text-sm leading-6 text-white/75">{details?.advancedPractice ?? lesson.practice}</p>
                <Button onClick={() => setLocation(`/workspace?course=${course.id}&lesson=${encodeURIComponent(lesson.title)}`)} className="relative mt-5 h-9 rounded-lg bg-white text-xs font-semibold text-slate-950 hover:bg-violet-50"><Play size={14} fill="currentColor" /> Кодын орчин нээх</Button>
              </div>
              <div className="rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-100">
                <div className="flex items-center gap-2 text-violet-700"><Sparkles size={16} /><span className="cc-mono-label text-[10px]">AI туслахын чиглэл</span></div>
                <p className="mt-4 text-sm leading-6 text-slate-600">Шууд хариу хэлэхээс өмнө асуултаар чиглүүлж, алдааг өөрөө олох сэжүүр өгнө.</p>
                <button type="button" onClick={() => setLocation(`/workspace?course=${course.id}&lesson=${encodeURIComponent(lesson.title)}&tutor=1`)} className="mt-5 text-xs font-bold text-violet-700 transition hover:text-violet-950">AI туслахаас асуух →</button>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-sm font-bold">{isProject ? "Практик төслийн үнэлгээ" : "Шалгалтын бэлтгэл"}</p><p className="mt-1 text-xs text-slate-400">{isProject ? "Кодын сангийн холбоос, ажиллаж буй холбоос болон тайлбараа илгээж, багшийн үнэлгээ, санал авна." : `Ойлголтоо баталгаажуулах ${details?.quiz.length ?? 0} бодит асуулт.`}</p></div>
                {isProject ? <Button onClick={() => setLocation(`/projects/${course.id}`)} className="h-9 rounded-lg bg-slate-950 text-xs hover:bg-violet-700">Төсөл илгээх</Button> : <Button onClick={() => setLocation(`/quiz/${course.id}/${lesson.id}`)} variant="outline" className="h-9 rounded-lg text-xs">Шалгалт эхлүүлэх</Button>}
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
