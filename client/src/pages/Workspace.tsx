import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, Code2, Play, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { buildPreviewDocument } from "@shared/workspace";

type Language = "html" | "css" | "javascript" | "python";

const starter: Record<Language, string> = {
  html: `<main class="card">\n  <h1>Сайн уу, CodeCraft!</h1>\n  <p>HTML бүтцээ энд турш.</p>\n</main>`,
  css: `.card {\n  padding: 24px;\n  border-radius: 16px;\n  background: #ede9fe;\n  color: #17152c;\n}`,
  javascript: `const learner = { name: "CodeCraft суралцагч", lessons: 3 };\nconsole.log(\`Сайн уу, \${learner.name}!\`);`,
  python: `name = "CodeCraft суралцагч"\nfor day in range(3):\n    print(f"Өдөр {day + 1}: {name}")`,
};

export default function Workspace() {
  const [location] = useLocation();
  const requestedLanguage = useMemo(() => new URLSearchParams(location.split("?")[1] ?? "").get("course"), [location]);
  const requestedLesson = useMemo(() => new URLSearchParams(location.split("?")[1] ?? "").get("lesson"), [location]);
  const initialLanguage = (requestedLanguage && Object.hasOwn(starter, requestedLanguage) ? requestedLanguage : "html") as Language;
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [code, setCode] = useState(starter[initialLanguage]);
  const [output, setOutput] = useState("Урьдчилан харах хэсэг бэлэн боллоо.");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tutorFailed, setTutorFailed] = useState(false);
  const [runToken, setRunToken] = useState(0);
  const { user } = useAuth();
  const tutor = trpc.tutor.ask.useMutation({ onSuccess: (data) => { setTutorFailed(false); setAnswer(data.answer); }, onError: (error) => { setTutorFailed(true); setAnswer(`AI туслахын алдаа: ${error.message}. Дахин оролдоод үзнэ үү.`); } });
  const preview = useMemo(() => buildPreviewDocument(language, code, starter.html, starter.css), [code, language, runToken]);

  useEffect(() => {
    if (requestedLanguage && Object.hasOwn(starter, requestedLanguage)) {
      const next = requestedLanguage as Language;
      setLanguage(next);
      setCode(starter[next]);
    }
  }, [requestedLanguage]);

  const selectLanguage = (next: Language) => {
    setLanguage(next);
    setCode(starter[next]);
    setOutput(next === "python" ? "Python ажиллах орчин бэлтгэгдэж байна. Энд кодын алхмаа төлөвлөж, AI туслахаас сэжүүр аваарай." : "Урьдчилан харах хэсэг бэлэн боллоо.");
  };
  const run = () => {
    setRunToken((value) => value + 1);
    if (language === "javascript") setOutput("JavaScript тусгаарлагдсан орчинд ажиллалаа. Гаралт болон алдааг баруун талын хэсгээс шалгана.");
    else if (language === "python") setOutput("Pyodide Python ажиллах орчин бэлтгэгдэж байна. Ачаалал хэдэн секунд үргэлжилж болно.");
    else setOutput("Шууд урьдчилан харах хэсэг шинэчлэгдлээ.");
  };
  const askTutor = () => {
    if (!user) { startLogin(); return; }
    if (!question.trim()) { setAnswer("Асуултаа бичээд илгээнэ үү."); return; }
    setTutorFailed(false);
    setAnswer("");
    tutor.mutate({ courseId: language, lessonTitle: requestedLesson ?? `${language.toUpperCase()} кодын орчин`, question, code });
  };
  const retryTutor = () => {
    if (user && question.trim()) {
      setTutorFailed(false);
      tutor.mutate({ courseId: language, lessonTitle: requestedLesson ?? `${language.toUpperCase()} кодын орчин`, question, code });
    }
  };

  return <div className="min-h-screen bg-[#0d0b1c] text-white">
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0d0b1c]/90 px-5 backdrop-blur lg:px-10">
      <Link href="/curriculum" className="cc-focus flex items-center gap-2 rounded-lg px-1 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} /> Хичээл рүү буцах</Link>
      <div className="flex items-center gap-2 font-mono text-sm"><span className="text-violet-300">&gt;_</span> CodeCraft кодын орчин</div>
      <span className="hidden items-center gap-1 text-xs text-emerald-300 sm:flex"><ShieldCheck size={14} /> Аюулгүй тусгаарлагдсан орчин</span>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-7 lg:px-10">
      <section className="cc-lab-grid relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#15122d] px-5 py-6 shadow-[0_24px_70px_rgba(4,3,20,0.35)] sm:px-7">
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div><p className="cc-mono-label text-[10px] text-violet-300">КОД БИЧИХ ОРЧИН · LIVE LAB</p><h1 className="cc-display mt-3 text-3xl font-bold text-white sm:text-4xl">Санаагаа код болго.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/60">Шууд туршиж, гаралтаа ажиглаад, AI туслахаас дараагийн сэжүүрээ ав.</p></div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Програмчлалын хэл сонгох">{(Object.keys(starter) as Language[]).map((item) => <button key={item} type="button" aria-pressed={language === item} onClick={() => selectLanguage(item)} className={`cc-focus rounded-lg px-3 py-2 text-xs font-bold uppercase ${language === item ? "bg-white text-slate-950 shadow-[0_6px_18px_rgba(255,255,255,0.14)]" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>{item}</button>)}</div>
        </div>
      </section>
      <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#17152c]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold"><Code2 size={16} className="text-violet-300" /> {language.toUpperCase()} код бичигч</div><div className="flex gap-2"><Button onClick={run} className="cc-focus h-8 rounded-lg bg-violet-500 px-3 text-xs hover:bg-violet-400"><Play size={13} fill="currentColor" /> Ажиллуулах</Button><button type="button" aria-label="Анхны кодыг сэргээх" onClick={() => setCode(starter[language])} className="cc-focus rounded-lg px-2 text-white/50 hover:bg-white/10 hover:text-white"><RotateCcw size={14} /></button></div></div>
          <textarea aria-label="Код засварлагч" value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} className="min-h-[330px] w-full resize-y bg-[#111024] p-5 font-mono text-sm leading-7 text-violet-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400" />
          <div aria-live="polite" className="border-t border-white/10 px-4 py-3 text-xs text-white/45">{output}</div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white text-slate-950">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">Шууд урьдчилан харах</div>
          <iframe title="Кодын урьдчилан харах" sandbox="allow-scripts" srcDoc={preview} className="h-[370px] w-full bg-white" />
          <div className="border-t border-slate-200 p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-600"><Bot size={15} /> AI туслах</div><p className="mt-2 text-xs leading-5 text-slate-500">Бэлэн хариу биш, өөрөө олох чиглүүлэг авна.</p><div className="mt-3 flex gap-2"><Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Жишээ: яагаад энэ код ажиллахгүй байна?" className="min-h-10 resize-none text-xs" /><Button aria-label="AI туслахад асуулт илгээх" onClick={askTutor} disabled={tutor.isPending} className="cc-focus h-10 w-10 shrink-0 bg-slate-950 p-0 hover:bg-violet-600">{tutor.isPending ? <span className="animate-pulse">...</span> : <Send size={15} />}</Button></div>{answer && <div aria-live="polite" className="mt-3 rounded-xl bg-violet-50 p-3 text-xs leading-5 text-slate-700"><Streamdown>{answer}</Streamdown>{tutorFailed && <button type="button" onClick={retryTutor} className="cc-focus mt-2 font-bold text-violet-700 underline">Дахин илгээх</button>}</div>}</div>
        </div>
      </section>
    </main>
  </div>;
}
