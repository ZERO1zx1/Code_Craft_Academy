import { CodeSandbox } from "@/components/CodeSandbox";
import { LessonChallenge } from "@/components/LessonChallenge";
import { LessonQuiz } from "@/components/LessonQuiz";
import { PracticeGuide } from "@/components/PracticeGuide";
import { Button } from "@/components/ui/button";
import { findLesson, findPath, type PathLesson } from "@/lib/curriculumData";
import { ArrowLeft, BookMarked, CheckCircle2, ChevronLeft, ChevronRight, CircleCheckBig, Clock3, Compass, Lightbulb, ListTree, Play, RotateCcw } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import "@/components/curriculum-path.css";
import "@/components/curriculum-mobile.css";
import "@/components/game-layer.css";
import "@/components/lesson-quiz.css";

type QuestStatus = "idle" | "failed" | "passed";

function CommandQuest({ lesson }: { lesson: PathLesson }) {
  const [code, setCode] = useState(lesson.challenge.starter);
  const [prediction, setPrediction] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [status, setStatus] = useState<QuestStatus>("idle");
  const [message, setMessage] = useState("");
  const [seconds, setSeconds] = useState(lesson.challenge.kind === "timed" ? 90 : 0);
  const timedOut = lesson.challenge.kind === "timed" && seconds === 0 && status !== "passed";

  useEffect(() => { setCode(lesson.challenge.starter); setPrediction(""); setShowHint(false); setStatus("idle"); setMessage(""); setSeconds(lesson.challenge.kind === "timed" ? 90 : 0); }, [lesson.challenge.kind, lesson.challenge.starter, lesson.id]);
  useEffect(() => { if (lesson.challenge.kind !== "timed" || status === "passed" || seconds <= 0) return; const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000); return () => window.clearInterval(timer); }, [lesson.challenge.kind, seconds, status]);
  useEffect(() => { if (lesson.challenge.kind === "timed" && seconds === 0 && status === "idle") { setStatus("failed"); setMessage("Цаг дууслаа. Эхнээс нь товчоор дахин оролдоно уу."); } }, [lesson.challenge.kind, seconds, status]);
  const reset = () => { setCode(lesson.challenge.starter); setPrediction(""); setStatus("idle"); setMessage(""); if (lesson.challenge.kind === "timed") setSeconds(90); };
  const verify = () => {
    if (lesson.challenge.prediction && prediction.trim().toLowerCase() !== lesson.challenge.prediction.answer.toLowerCase()) { setStatus("failed"); setMessage("Command prediction тохирохгүй байна. Lesson-ийн гол command-оо дахин шалгаарай."); return; }
    const normalized = code.replace(/\s+/g, " ").trim().toLowerCase();
    const passed = lesson.challenge.expected.every((command) => normalized.includes(command.replace(/\s+/g, " ").trim().toLowerCase()));
    if (!passed) { setStatus("failed"); setMessage(`Энэ quest-д шаардлагатай command: ${lesson.challenge.expected.join(" ")}`); return; }
    setStatus("passed"); setMessage("Command structure зөв байна. Дараагийн эсвэл дуртай lesson рүүгээ үргэлжлүүлээрэй.");
  };
  const label = { build: "BUILD QUEST", debug: "DEBUG QUEST", predict: "OUTPUT QUEST", timed: "TIMED QUEST" }[lesson.challenge.kind ?? "build"];
  return <section className="lesson-challenge"><div className="path-section-head"><div><p className="section-kicker">{label} {lesson.challenge.kind === "timed" ? `· ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : ""}</p><h2>{lesson.challenge.prompt}</h2></div><Play /></div><div className="challenge-layout"><div className="challenge-editor"><div className="editor-top"><span>challenge.sh</span><button type="button" onClick={reset}><RotateCcw size={14} /> Эхнээс нь</button></div>{lesson.challenge.kind === "debug" && <p className="quest-mode-note">DEBUG QUEST: Эх кодонд зориуд дутуу эсвэл буруу command бий. Албан жишээтэй харьцуулж засна уу.</p>}{lesson.challenge.prediction && <label className="quest-prediction">{lesson.challenge.prediction.prompt}<input value={prediction} onChange={(event) => setPrediction(event.target.value)} placeholder="Жишээ: git status" /></label>}<textarea value={code} onChange={(event) => { setCode(event.target.value); setStatus("idle"); setMessage(""); }} spellCheck={false} aria-label="GitHub command" /><div className="challenge-controls"><Button variant="outline" onClick={() => setShowHint((value) => !value)}><Lightbulb size={15} /> Hint</Button><Button className="atlas-button" disabled={timedOut} onClick={verify}><CheckCircle2 size={15} /> {timedOut ? "Цаг дууссан" : "Command шалгах"}</Button></div>{showHint && <p className="challenge-hint"><Lightbulb size={15} /> {lesson.challenge.hint}</p>}{status === "failed" && <p className="challenge-result failed">{message}</p>}{status === "passed" && <p className="challenge-result passed">{message}</p>}</div><div className="challenge-preview lab-callout"><span>COMMAND SIMULATOR</span><h3>GitHub command-ийг аюулгүй дадлагажуул.</h3><p>Энд бодит terminal, repository, token, network ашиглахгүй. Command-ийн утга ба workflow-оо батлаад дараа нь өөрийн GitHub account дээр албан заавраар туршина.</p><Clock3 size={18} /></div></div></section>;
}

export default function FreePathLesson({ params }: { params: { language?: string; lesson?: string } }) {
  const path = findPath(params.language);
  const lesson = findLesson(path, params.lesson);
  const [isPathNavOpen, setPathNavOpen] = useState(false);
  const currentIndex = path.lessons.findIndex((item) => item.id === lesson.id);
  const previous = path.lessons[currentIndex - 1];
  const next = path.lessons[currentIndex + 1];
  useEffect(() => { setPathNavOpen(false); }, [lesson.id]);

  return <div className="path-page" style={{ "--path-accent": path.accent, "--path-pale": path.pale } as React.CSSProperties}><header className="path-header"><Link href="/" className="path-brand"><ArrowLeft size={16} /><span>CodeCraft Academy</span></Link><span className="free-mode-label"><Compass size={14} /> Бүх lesson нээлттэй</span></header><main className="path-shell"><aside className="path-sidebar"><div className="path-sidebar-intro"><p className="section-kicker">{path.label} PATH</p><h1>{path.project}</h1><p>{path.description}</p><a href={path.source} target="_blank" rel="noreferrer"><BookMarked size={14} /> Албан эх сурвалж: {path.sourceLabel}</a></div><button type="button" className="path-nav-toggle" aria-expanded={isPathNavOpen} aria-controls="path-lesson-nav" onClick={() => setPathNavOpen((open) => !open)}><span><ListTree size={16} /> {path.label} хичээлүүд</span><b>{isPathNavOpen ? "Хаах" : `${path.lessons.length} lesson харах`}</b></button><nav id="path-lesson-nav" className={isPathNavOpen ? "is-open" : ""} aria-label={`${path.label} хичээлүүд`}>{path.lessons.map((item) => <Link key={item.id} href={`/learn/${path.id}/${item.id}`} className={item.id === lesson.id ? "path-node active" : "path-node"}><span>{item.order}</span><div><b>{item.title}</b><small>{item.duration}</small></div></Link>)}</nav></aside><section className="path-content"><div className="lesson-hero"><p className="section-kicker">LESSON {String(lesson.order).padStart(2, "0")} · {path.label}</p><h2>{lesson.title}</h2><p>{lesson.summary}</p><div><span><ListTree size={15} /> {lesson.keywords.length} tag / keyword</span><span><Compass size={15} /> Шууд нээлттэй</span></div></div><section className="keyword-atlas"><div className="path-section-head"><div><p className="section-kicker">KEYWORD ATLAS</p><h2>Юу нь, яаж ажилладгийг задлая.</h2></div><BookMarked /></div><div className="keyword-grid">{lesson.keywords.map((keyword) => <article key={keyword.term}><code>{keyword.term}</code><p>{keyword.meaning}</p></article>)}</div></section><section className="lesson-example"><div className="path-section-head"><div><p className="section-kicker">READ THE CODE</p><h2>Мөр бүрийн зорилгыг уншаад, өөрийн үгээр тайлбарла.</h2></div></div><pre><code>{lesson.code}</code></pre></section>{path.id === "github" ? <CommandQuest lesson={lesson} /> : <LessonChallenge language={path.id} lesson={lesson} isSaving={false} onComplete={async () => {}} />}{(path.id === "javascript" || path.id === "python") && <section className="path-lab"><div className="path-section-head"><div><p className="section-kicker">RUN + OBSERVE</p><h2>Кодын үр дүнг лабораторид шалга.</h2></div></div><CodeSandbox /></section>}<PracticeGuide language={path.id} source={path.source} sourceLabel={path.sourceLabel} /><LessonQuiz questions={lesson.quiz ?? []} /><footer className="lesson-nav">{previous ? <Link href={`/learn/${path.id}/${previous.id}`}><ChevronLeft size={17} /> Өмнөх: {previous.title}</Link> : <Link href="/"><ChevronLeft size={17} /> Бүх сургалтын зам</Link>}{next ? <Link className="next" href={`/learn/${path.id}/${next.id}`}>Дараах lesson: {next.title} <ChevronRight size={17} /></Link> : <Link className="next" href="/">Бүх сургалтын зам <CircleCheckBig size={17} /></Link>}</footer></section></main></div>;
}
