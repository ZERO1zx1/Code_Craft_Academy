import { GitHubPortfolioChecklist } from "@/components/GitHubPortfolioChecklist";
import { Button } from "@/components/ui/button";
import { languagePaths, type LanguageId } from "@/lib/curriculumData";
import { readLearningState, type LocalLearningState } from "@/lib/localLearning";
import { ArrowRight, BookOpen, Compass, Search, ShieldCheck, SlidersHorizontal, Tags } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import "@/components/curriculum-home.css";
import "@/components/curriculum-path.css";
import "@/components/free-learning.css";

const topicFilters: Array<{ id: string; label: string; pathIds: LanguageId[]; terms: string[] }> = [
  { id: "semantic", label: "Semantic HTML", pathIds: ["html"], terms: ["semantic", "accessibility", "aria", "structure", "element", "attribute"] },
  { id: "layout", label: "Layout & UI", pathIds: ["css"], terms: ["layout", "flex", "grid", "responsive", "selector", "style"] },
  { id: "logic", label: "Browser logic", pathIds: ["javascript"], terms: ["javascript", "event", "dom", "async", "function", "promise"] },
  { id: "data", label: "Python data", pathIds: ["python"], terms: ["python", "list", "dict", "loop", "class", "function"] },
  { id: "workflow", label: "Git workflow", pathIds: ["github"], terms: ["github", "repository", "branch", "commit", "pull request", "workflow"] },
] as const;

function searchablePathText(path: typeof languagePaths[number]) {
  return [path.label, path.project, path.description, ...path.lessons.flatMap((lesson) => [lesson.title, lesson.summary, ...lesson.keywords.map((keyword) => `${keyword.term} ${keyword.meaning}`)])].join(" ").toLocaleLowerCase();
}

export default function LearningHub() {
  const [learningState, setLearningState] = useState<LocalLearningState>(() => readLearningState());
  const [query, setQuery] = useState("");
  const [activePath, setActivePath] = useState("all");
  const [activeTopic, setActiveTopic] = useState("all");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visiblePaths = useMemo(() => languagePaths.filter((path) => {
    const text = searchablePathText(path);
    if (activePath !== "all" && path.id !== activePath) return false;
    if (normalizedQuery && !text.includes(normalizedQuery)) return false;
    const topic = topicFilters.find((item) => item.id === activeTopic);
    return !topic || topic.pathIds.includes(path.id);
  }), [activePath, activeTopic, normalizedQuery]);

  useEffect(() => {
    const syncState = () => setLearningState(readLearningState());
    window.addEventListener("storage", syncState);
    return () => window.removeEventListener("storage", syncState);
  }, []);

  const resetFilters = () => { setQuery(""); setActivePath("all"); setActiveTopic("all"); };

  return <div className="curriculum-home"><header className="path-header"><Link href="/" className="path-brand"><Compass size={16} /> CodeCraft Academy</Link><span className="free-mode-label"><ShieldCheck size={14} /> Үнэгүй · Нэвтрэлтгүй</span></header><main><section className="curriculum-intro"><p className="section-kicker">FREE LEARNING CENTER</p><h1>Нэг index биш.<br /><em>Таван тусдаа</em> кодын зам.</h1><p>HTML, CSS, JavaScript, Python, GitHub бүрийн tag, property, keyword, command нь өөрийн lesson, source link, quiz, quest, Practice Guide-тэй. Бүртгэлгүйгээр шууд эхэл.</p><p className="open-access-note"><ShieldCheck size={15} /> Бүх lesson шууд нээлттэй. Хэзээ ч, хаанаас ч дуртай сэдвээсээ эхэлж болно.</p></section><section className="lesson-finder" aria-labelledby="lesson-finder-heading"><div><p className="section-kicker">FIND A LESSON</p><h2 id="lesson-finder-heading">Сэдвээ олоод шууд эхэл.</h2></div><label className="lesson-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Жишээ: flex, async, list, branch, README" aria-label="Хичээл хайх" /><span>{visiblePaths.length} path</span></label><div className="path-filters" aria-label="Сургалтын зам шүүх"><span><SlidersHorizontal size={15} /> Хэл:</span><button type="button" className={activePath === "all" ? "active" : ""} onClick={() => setActivePath("all")}>Бүгд</button>{languagePaths.map((path) => <button key={path.id} type="button" className={activePath === path.id ? "active" : ""} onClick={() => setActivePath(path.id)}>{path.label}</button>)}</div><div className="topic-filters" aria-label="Хичээлийн сэдвээр шүүх"><span><Tags size={15} /> Сэдэв:</span><button type="button" className={activeTopic === "all" ? "active" : ""} onClick={() => setActiveTopic("all")}>Бүгд</button>{topicFilters.map((topic) => <button key={topic.id} type="button" className={activeTopic === topic.id ? "active" : ""} onClick={() => setActiveTopic(topic.id)}>{topic.label}</button>)}</div></section><section className="language-path-grid" aria-label="Сургалтын замууд">{visiblePaths.map((path) => { const matches = normalizedQuery ? path.lessons.filter((lesson) => [lesson.title, lesson.summary, ...lesson.keywords.map((keyword) => `${keyword.term} ${keyword.meaning}`)].join(" ").toLocaleLowerCase().includes(normalizedQuery)).length : 0; const topic = topicFilters.find((item) => item.id === activeTopic); const topicMatches = topic ? path.lessons.filter((lesson) => { const lessonText = [lesson.title, lesson.summary, ...lesson.keywords.map((keyword) => `${keyword.term} ${keyword.meaning}`)].join(" ").toLocaleLowerCase(); return topic.terms.some((term) => lessonText.includes(term)); }).length : 0; return <article key={path.id} style={{ "--path-accent": path.accent, "--path-pale": path.pale } as React.CSSProperties}><div className="language-card-top"><span>{path.label}</span><b>{path.lessons.length} lesson</b></div><h2>{path.project}</h2><p>{path.description}</p>{normalizedQuery && <em className="lesson-match-count">{matches} matching lesson</em>}{topic && <em className="lesson-match-count">{topicMatches} {topic.label} lesson</em>}<small><BookOpen size={14} /> {path.lessons.length} тусдаа lesson · quiz · quest</small><Link href={`/learn/${path.id}/${path.lessons[0].id}`} className="language-path-cta">Path нээх <ArrowRight size={16} /></Link></article>; })}</section>{visiblePaths.length === 0 && <section className="lesson-empty"><Search size={23} /><h2>Тохирох lesson олдсонгүй.</h2><p>Өөр keyword ашиглах эсвэл хэл, сэдвийн шүүлтээ цэвэрлээд дахин хайна уу.</p><Button variant="outline" onClick={resetFilters}>Шүүлт цэвэрлэх</Button></section>}<section className="curriculum-rules"><div><p className="section-kicker">HOW IT WORKS</p><h2>Унших биш, хийж батал.</h2></div><p><b>01</b> Нэг tag, property, keyword эсвэл Git command-ийн тайлбарыг авна. <b>02</b> Code example-ийг задлана. <b>03</b> Quiz, debug, build эсвэл timed quest хийж шалгуулна. <b>04</b> Дараагийн эсвэл дуртай lesson рүүгээ шууд шилжинэ.</p></section><GitHubPortfolioChecklist learningState={learningState} onStateChange={setLearningState} /><section className="free-learning-note"><div><ShieldCheck size={20} /><div><p className="section-kicker">OPEN LEARNING</p><h2>Хичээл бүр үнэгүй, шууд нээлттэй.</h2><p>CodeCraft Academy нь таны хичээл үзэх дарааллыг хязгаарлахгүй. Exercise, quiz, sandbox, Practice Guide-ийг өөрийн хурдаар ашиглана.</p></div></div></section></main></div>;
}
