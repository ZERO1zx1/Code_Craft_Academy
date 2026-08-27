import { Button } from "@/components/ui/button";
import type { LanguageId, PathLesson } from "@/lib/curriculumData";
import { CheckCircle2, ChevronRight, Lightbulb, Play, RotateCcw } from "lucide-react";
import React, { useEffect, useState } from "react";
import "./curriculum-path.css";

type Validation = { ok: boolean; message?: string };
const pass = (): Validation => ({ ok: true });
const fail = (message: string): Validation => ({ ok: false, message });

function validateHtml(id: string, code: string, expectedSelectors: string[]): Validation {
  const root = new DOMParser().parseFromString(code, "text/html");
  const has = (selector: string) => Boolean(root.querySelector(selector));
  const checks: Record<string, () => Validation> = {
    "html-document": () => has("html[lang='mn']") && has("head meta[charset='UTF-8']") && root.querySelector("head title")?.textContent?.trim() === "CodeCraft HTML" ? pass() : fail("`html lang=\"mn\"`, UTF-8 meta болон `CodeCraft HTML` title-аа зөв оруулна уу."),
    "html-semantic-text": () => has("main section h2") && has("main section article p") ? pass() : fail("`main > section` дотор `h2`, `article`, `p` semantic hierarchy шаардлагатай."),
    "html-links-media": () => has("figure img[alt]") && has("figure figcaption") && has("a[href][target='_blank']") ? pass() : fail("Figure дотор alt-той img, figcaption, шинэ tab-д нээгдэх anchor оруулна уу."),
    "html-lists-tables": () => has("table thead th[scope='col']") && has("table tbody td") ? pass() : fail("Table нь thead дахь `th scope=\"col\"`, tbody дахь td-тэй байх ёстой."),
    "html-forms": () => has("form label[for]") && has("form input[type='email'][required]") && has("form textarea") && has("form button[type='submit']") ? pass() : fail("Form-д label-for, required email input, textarea, submit button бүгд хэрэгтэй."),
    "html-accessibility-project": () => has("meta[name='viewport']") && has("main section") && has("ul li") && has("a[href]") && has("form") ? pass() : fail("Mini project-д viewport metadata, main/section, жагсаалт, холбоос, form оруулна уу."),
  };
  return checks[id]?.() ?? (expectedSelectors.every(has) ? pass() : fail(`Эдгээр HTML element/attribute дутуу байна: ${expectedSelectors.join(", ")}`));
}

function validateCss(id: string, code: string, expectedRules: string[]): Validation {
  const style = document.createElement("style");
  style.textContent = code;
  document.head.append(style);
  const rules = Array.from(style.sheet?.cssRules ?? []);
  const rule = (selector: string) => rules.find((item): item is CSSStyleRule => item instanceof CSSStyleRule && item.selectorText === selector);
  const hasProperties = (selector: string, properties: string[]) => Boolean(rule(selector) && properties.every((property) => rule(selector)?.style.getPropertyValue(property).trim()));
  const mediaHas = (media: string, selector: string, properties: string[] = []) => rules.some((item) => item instanceof CSSMediaRule && item.conditionText.includes(media) && Array.from(item.cssRules).some((nested): nested is CSSStyleRule => nested instanceof CSSStyleRule && nested.selectorText === selector && properties.every((property) => nested.style.getPropertyValue(property).trim())));
  const checks: Record<string, () => Validation> = {
    "css-selectors-cascade": () => hasProperties(".lesson-card", ["border"]) && hasProperties(".lesson-card p", ["color"]) && hasProperties(".lesson-card a:hover", ["color"]) ? pass() : fail("`.lesson-card`, `.lesson-card p`, `.lesson-card a:hover` rule бүр шаардсан property-тэй байх ёстой."),
    "css-values-box": () => hasProperties(".challenge", ["max-width", "margin", "padding", "border", "background"]) ? pass() : fail("`.challenge` rule-д max-width, margin, padding, border, background бүгд хэрэгтэй."),
    "css-typography": () => hasProperties(".lesson-title", ["font-family", "font-size", "line-height"]) ? pass() : fail("`.lesson-title`-д font-family, font-size, line-height нэмнэ үү."),
    "css-flex": () => hasProperties(".actions", ["display", "justify-content", "gap", "flex-wrap"]) && rule(".actions")?.style.display === "flex" ? pass() : fail("`.actions` нь display:flex, justify-content, gap, flex-wrap-тэй байх ёстой."),
    "css-grid-responsive": () => hasProperties(".module-grid", ["display", "grid-template-columns"]) && rule(".module-grid")?.style.display === "grid" && mediaHas("max-width: 720px", ".module-grid", ["grid-template-columns"]) ? pass() : fail("Desktop grid болон 720px mobile media query доторх grid-template-columns хоёул хэрэгтэй."),
    "css-motion-project": () => hasProperties(".card", ["transition"]) && hasProperties(".card:hover", ["transform"]) && hasProperties(".card:focus-visible", ["outline"]) && mediaHas("prefers-reduced-motion", ".card", ["transition"]) ? pass() : fail("Card дээр transition, hover transform, focus-visible outline, reduced-motion media rule бүгд хэрэгтэй."),
  };
  const genericPassed = expectedRules.every((expected) => { const [selector, property] = expected.split("::"); return Boolean(selector && property && rule(selector)?.style.getPropertyValue(property).trim()); });
  style.remove();
  return checks[id]?.() ?? (genericPassed ? pass() : fail("Энэ lesson-ийн selector болон шаардлагатай CSS property-г зөв rule дотор бичнэ үү."));
}

function validateGitHub(code: string, commands: string[]): Validation {
  const normalizedCode = code.replace(/\s+/g, " ").trim().toLowerCase();
  return commands.every((command) => normalizedCode.includes(command.replace(/\s+/g, " ").trim().toLowerCase())) ? pass() : fail(`Зөв command: ${commands.join(" ")}`);
}

export const jsAssertions: Record<string, string> = {
  "js-values": "if (typeof course !== 'string' || typeof xp !== 'number' || typeof isReady !== 'boolean') throw new Error('course, xp, isReady-ийн type буруу байна');",
  "js-control-flow": "if (!console.__logs.some((line) => line.includes('pass'))) throw new Error('score 72 үед pass output гарах ёстой');",
  "js-functions-arrays": "if (typeof formatLesson !== 'function' || formatLesson('HTML') !== 'Lesson: HTML') throw new Error('formatLesson function зөв үр дүн буцаах ёстой');",
  "js-objects-modules": "if (typeof learner !== 'object' || learner.name !== 'Naraa' || learner.level !== 2) throw new Error('learner object-ийн name, level value-ийг шалгана уу');",
  "js-dom-events": "if (document.__nodes['#result'].textContent !== 'Зөв!') throw new Error('#result textContent click event-ийн дараа Зөв! болох ёстой');",
  "js-async-errors": "if (typeof load !== 'function') throw new Error('load async function тодорхойлогдсон байх ёстой'); await load();",
};

function executeJavaScript(id: string, code: string) {
  return new Promise<Validation>((resolve) => {
    const source = `self.onmessage = async ({data}) => { try { const logs=[]; const console={log:(...args)=>logs.push(args.join(' ')),error:(...args)=>logs.push(args.join(' ')),__logs:logs}; const nodes={}; const document={__nodes:nodes,querySelector:(selector)=>nodes[selector]||(nodes[selector]={textContent:'',addEventListener:(type,callback)=>{if(type==='click')callback({preventDefault:()=>{}})},classList:{add:()=>{},remove:()=>{},toggle:()=>{}}}),querySelectorAll:()=>[]}; const fetch=async()=>({ok:true,json:async()=>({lesson:'ok'})}); const runner=new Function('console','document','fetch', 'return (async()=>{'+data.code+'; '+data.assertion+'; return true;})()'); await runner(console,document,fetch); self.postMessage({ok:true}); } catch(error) { self.postMessage({ok:false,error:error instanceof Error ? error.message : 'JavaScript алдаа'}); } };`;
    const worker = new Worker(URL.createObjectURL(new Blob([source], { type: "text/javascript" })));
    const timeout = window.setTimeout(() => { worker.terminate(); resolve(fail("JavaScript ажиллах хугацаа хэтэрлээ. Infinite loop байгаа эсэхийг шалгана уу.")); }, 2500);
    worker.onmessage = ({ data }) => { window.clearTimeout(timeout); worker.terminate(); resolve(data.ok ? pass() : fail(`JavaScript behavior алдаа: ${data.error}`)); };
    worker.postMessage({ code, assertion: jsAssertions[id] ?? "if (!console.__logs.includes('quest-ok')) throw new Error('quest-ok output гарах ёстой');" });
  });
}

export const pythonAssertions: Record<string, string> = {
  "py-syntax-values": "assert isinstance(name, str) and isinstance(level, int) and isinstance(is_ready, bool)",
  "py-collections": "assert isinstance(topics, list) and 'Python' in topics and profile['name'] == 'Naraa'",
  "py-control-flow": "assert score == 72 and 'outcome' in globals() and outcome == 'pass'",
  "py-functions": "assert is_passed(70) is True and is_passed(69) is False",
  "py-modules-files": "assert content == 'CodeCraft'",
  "py-errors-classes": "candidate = Learner('Test')\ncandidate.add_xp(5)\nassert candidate.name == 'Test' and candidate.xp == 5",
};

export const pythonExpectedOutput: Record<string, string[]> = { "py-control-flow": ["pass", "1", "2", "3"] };
const pythonSetup: Record<string, string> = { "py-modules-files": "with open('notes.txt', 'w', encoding='utf-8') as file:\n    file.write('CodeCraft')" };

function executePython(id: string, code: string) {
  return new Promise<Validation>((resolve) => {
    const worker = new Worker(new URL("../workers/python-worker.ts", import.meta.url), { type: "module" });
    const timeout = window.setTimeout(() => { worker.terminate(); resolve(fail("Python ажиллах хугацаа хэтэрлээ. Давталт эсвэл алдаатай кодоо шалгана уу.")); }, 8000);
    worker.onmessage = ({ data }) => { window.clearTimeout(timeout); worker.terminate(); resolve(data.error ? fail(`Python behavior алдаа: ${data.error}`) : pass()); };
    worker.postMessage({ id: Date.now(), code, setup: pythonSetup[id], assertion: pythonAssertions[id] ?? "", expectedOutput: pythonExpectedOutput[id] ?? ["quest-ok"] });
  });
}

function labCopy(language: LanguageId) {
  if (language === "github") return { label: "COMMAND SIMULATOR", title: "Git/GitHub workflow-ийг аюулгүй дадлагажуул.", text: "Энэ simulator бодит repository, terminal, token, network ашиглахгүй. Command-ийн бүтэц ба workflow-оо энд батлаад GitHub Docs-ийн дагуу өөрийн repository дээр туршина уу." };
  if (language === "javascript") return { label: "BROWSER WORKER", title: "JavaScript-ээ browser дотор аюулгүй шалгая.", text: "Таны код тусгаарлагдсан Web Worker-д ажиллана. Console output, DOM event эсвэл async логик нь requirement-ийг хангаж буй эсэхийг автоматаар шалгана; таны код сервер рүү илгээгдэхгүй." };
  return { label: "PYTHON WORKER", title: "Python-оо browser дотор ажиллуулж шалгая.", text: "Таны Python код тусгаарлагдсан Pyodide worker-д ажиллана. Output болон assertion-оор үр дүнг шалгах бөгөөд таны код сервер рүү илгээгдэхгүй." };
}

export function LessonChallenge({ language, lesson, isSaving, onComplete }: { language: LanguageId; lesson: PathLesson; completed?: boolean; isSaving: boolean; onComplete: () => Promise<void> }) {
  const [code, setCode] = useState(lesson.challenge.starter);
  const [showHint, setShowHint] = useState(false);
  const [status, setStatus] = useState<"idle" | "failed" | "passed">("idle");
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [prediction, setPrediction] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(lesson.challenge.kind === "timed" ? 90 : 0);
  const timedOut = lesson.challenge.kind === "timed" && secondsLeft === 0 && status !== "passed";
  const mode = lesson.challenge.kind ?? "build";
  const callout = labCopy(language);

  useEffect(() => { setCode(lesson.challenge.starter); setShowHint(false); setStatus("idle"); setResult(null); setPrediction(""); setSecondsLeft(lesson.challenge.kind === "timed" ? 90 : 0); }, [lesson.id, lesson.challenge.starter, lesson.challenge.kind]);
  useEffect(() => { if (mode !== "timed" || status === "passed" || secondsLeft <= 0) return; const timer = window.setInterval(() => setSecondsLeft((current) => current - 1), 1000); return () => window.clearInterval(timer); }, [mode, secondsLeft, status]);
  useEffect(() => { if (mode === "timed" && secondsLeft === 0 && status === "idle") { setStatus("failed"); setResult("Цаг дууслаа. Эхнээс нь товчоор 90 секундийн шинэ оролдлого эхлүүлээрэй."); } }, [mode, secondsLeft, status]);

  const resetQuest = () => { setCode(lesson.challenge.starter); setPrediction(""); setStatus("idle"); setResult(null); if (mode === "timed") setSecondsLeft(90); };
  const verify = async () => {
    if (lesson.challenge.prediction && prediction.trim().toLowerCase() !== lesson.challenge.prediction.answer.toLowerCase()) { setStatus("failed"); setResult("Prediction хариулт таарахгүй байна. Гол keyword/tag/command-оо дахин шалгаарай."); return; }
    setValidating(true); setResult(null);
    try {
      const validation = language === "html" ? validateHtml(lesson.id, code, lesson.challenge.expected) : language === "css" ? validateCss(lesson.id, code, lesson.challenge.expected) : language === "javascript" ? await executeJavaScript(lesson.id, code) : language === "python" ? await executePython(lesson.id, code) : validateGitHub(code, lesson.challenge.expected);
      if (!validation.ok) { setStatus("failed"); setResult(validation.message ?? "Quest шалгалтад тэнцсэнгүй."); return; }
      await onComplete(); setStatus("passed"); setResult("Quest амжилттай боллоо. Дараагийн эсвэл дуртай lesson рүүгээ үргэлжлүүлээрэй.");
    } catch { setStatus("failed"); setResult("Шалгалтыг дуусгаж чадсангүй. Дахин оролдоорой."); } finally { setValidating(false); }
  };
  const preview = language === "html" ? code : language === "css" ? `<main class="challenge-card"><h1>CSS Challenge</h1><p>Энд таны CSS preview харагдана.</p><button>Турших</button></main><style>body{padding:24px;font-family:system-ui}.challenge-card{max-width:520px;margin:auto;padding:24px;border:1px solid #d8ded9}${code}</style>` : "";
  const questLabel = { build: "BUILD QUEST", debug: "DEBUG QUEST", predict: "OUTPUT QUEST", timed: "TIMED QUEST" }[mode];
  const extension = language === "python" ? "py" : language === "javascript" ? "js" : language === "css" ? "css" : language === "github" ? "sh" : "html";

  return <section className="lesson-challenge"><div className="path-section-head"><div><p className="section-kicker">{questLabel} {mode === "timed" ? `· ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}` : ""}</p><h2>{lesson.challenge.prompt}</h2></div><Play /></div><div className="challenge-layout"><div className="challenge-editor"><div className="editor-top"><span>challenge.{extension}</span><button type="button" onClick={resetQuest}><RotateCcw size={14} /> Эхнээс нь</button></div>{mode === "debug" && <p className="quest-mode-note">DEBUG QUEST: Эх кодонд зориуд алдаа бий. Requirement болон example-оо харьцуулж засна уу.</p>}{lesson.challenge.prediction && <label className="quest-prediction">{lesson.challenge.prediction.prompt}<input value={prediction} onChange={(event) => setPrediction(event.target.value)} placeholder="Жишээ: &lt;p&gt;, async эсвэл git status" /></label>}<textarea value={code} onChange={(event) => { setCode(event.target.value); setStatus("idle"); setResult(null); }} spellCheck={false} aria-label="Challenge код" /><div className="challenge-controls"><Button variant="outline" onClick={() => setShowHint((current) => !current)}><Lightbulb size={15} /> Hint</Button><Button className="atlas-button" disabled={isSaving || validating || timedOut} onClick={verify}><CheckCircle2 size={15} /> {timedOut ? "Цаг дууссан" : validating ? "Шалгаж байна..." : "Код шалгах"}</Button></div>{showHint && <p className="challenge-hint"><Lightbulb size={15} /> {lesson.challenge.hint}</p>}{status === "failed" && <p className="challenge-result failed">{result}</p>}{status === "passed" && <p className="challenge-result passed">{result}</p>}</div>{preview ? <div className="challenge-preview"><span>LIVE PREVIEW</span><iframe title="Challenge preview" sandbox="allow-scripts" srcDoc={preview} /></div> : <div className="challenge-preview lab-callout"><span>{callout.label}</span><h3>{callout.title}</h3><p>{callout.text}</p><ChevronRight size={18} /></div>}</div></section>;
}
