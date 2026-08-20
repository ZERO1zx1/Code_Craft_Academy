import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Loader2, Trophy } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { getCourse, lessonDetails, type Course } from "@shared/curriculum";
import { scoreQuizAnswers } from "@shared/quiz";

const validCourses: Course["id"][] = ["python", "html", "css", "javascript"];

export default function Quiz() {
  const [, params] = useRoute("/quiz/:courseId/:lessonId");
  const courseId = validCourses.includes(params?.courseId as Course["id"]) ? params?.courseId as Course["id"] : "python";
  const course = getCourse(courseId);
  const lesson = course.lessons.find((item) => item.id === params?.lessonId) ?? course.lessons[0];
  const questions = lessonDetails[lesson.id]?.quiz ?? [];
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const existingAttempt = trpc.quiz.getAttempt.useQuery({ lessonId: lesson.id }, { enabled: Boolean(user) });
  const submit = trpc.quiz.submit.useMutation({ onSuccess: () => { setSubmitted(true); existingAttempt.refetch(); } });
  const score = scoreQuizAnswers(questions, answers);
  const allAnswered = questions.length > 0 && answers.length === questions.length && answers.every((answer) => Number.isInteger(answer));

  useEffect(() => {
    setAnswers([]);
    setSubmitted(false);
  }, [lesson.id]);

  const choose = (questionIndex: number, optionIndex: number) => {
    if (submitted) return;
      setAnswers((current: number[]) => {
      const next = [...current];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!user) { startLogin(); return; }
    if (!allAnswered) return;
    submit.mutate({ courseId, lessonId: lesson.id, answers });
  };

  const reset = () => { setAnswers([]); setSubmitted(false); submit.reset(); };
  const savedAttempt = existingAttempt.data;

  return <div className="min-h-screen bg-[#f7f8fb] text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5"><Link href="/curriculum" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"><ArrowLeft size={16} /> Curriculum</Link><span className="font-mono text-sm font-bold text-violet-600">QUIZ / {courseId.toUpperCase()}</span></div></header><main className="mx-auto max-w-3xl px-5 py-10"><div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-violet-300">{course.title}</p><h1 className="mt-3 text-3xl font-bold tracking-tight">{lesson.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Асуулт бүрийг сонгоод Submit хийхэд оноо болон хариултын тайлбар гарна. Login хийсэн бол хамгийн сүүлийн оролдлого database-д хадгалагдана.</p><div className="mt-5 flex flex-wrap gap-3 text-xs"><span className="rounded-full bg-white/10 px-3 py-1.5">{questions.length} асуулт</span>{savedAttempt && <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-200">Хадгалагдсан дүн: {savedAttempt.score}%</span>}</div></div>{questions.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-semibold">Энэ хичээлийн quiz бэлэн болоогүй байна.</p><Link href="/curriculum" className="mt-4 inline-block text-sm font-bold text-violet-700">Хичээл рүү буцах</Link></div> : <div className="mt-7 space-y-5">{questions.map((question: (typeof questions)[number], questionIndex: number) => <section key={question.prompt} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{questionIndex + 1}</span><h2 className="pt-1 text-base font-bold">{question.prompt}</h2></div><div className="mt-5 space-y-2">{question.options.map((option: string, optionIndex: number) => { const selected = answers[questionIndex] === optionIndex; const correct = submitted && optionIndex === question.answer; const wrong = submitted && selected && !correct; return <button type="button" key={option} disabled={submitted} onClick={() => choose(questionIndex, optionIndex)} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${correct ? "border-emerald-300 bg-emerald-50 text-emerald-900" : wrong ? "border-rose-300 bg-rose-50 text-rose-900" : selected ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"}`}><span>{correct ? <CheckCircle2 size={18} /> : <Circle size={18} className={selected ? "text-violet-600" : "text-slate-300"} />}</span>{option}</button>; })}</div>{submitted && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600"><strong>Тайлбар:</strong> {question.explanation}</p>}</section>)}<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{allAnswered ? "Бүх хариулт сонгогдсон." : `${answers.filter((item: number) => Number.isInteger(item)).length}/${questions.length} хариулт сонгогдсон.`}</p>{submitted ? <div className="flex items-center gap-3"><span className="flex items-center gap-1.5 text-sm font-bold text-emerald-700"><Trophy size={16} /> {score.correct}/{score.total} · {score.percent}%</span><Button onClick={reset} variant="outline">Дахин оролдох</Button></div> : <Button onClick={handleSubmit} disabled={!allAnswered || submit.isPending} className="bg-slate-950 hover:bg-violet-700">{submit.isPending ? <Loader2 className="animate-spin" /> : null}{user ? "Хариултаа шалгах" : "Login хийж quiz өгөх"}</Button>}</div>{submit.error && <p className="mt-3 text-xs font-semibold text-rose-600">Хадгалах үед алдаа гарлаа: {submit.error.message}</p>}</section></div>}</main></div>;
}
