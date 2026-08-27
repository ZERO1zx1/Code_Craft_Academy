import { courses, findCourse, findLesson } from "./curriculum.js";

const app = document.querySelector("#main-content");
const portfolioKey = "codecraft-portfolio-checklist";
const portfolioItems = ["Profile зураг ба товч bio", "Profile README", "3 жижиг repository", "Repository README", "Тодорхой commit history", "Нэг pull request", "Pinned repositories", "Project link"];

const esc = (value) => String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
const navigate = (route) => { location.hash = route; };
const getPortfolio = () => JSON.parse(localStorage.getItem(portfolioKey) || "[]");
const setPortfolio = (items) => localStorage.setItem(portfolioKey, JSON.stringify(items));

function headerMarkup(eyebrow, title, copy) {
  return `<section class="hero"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${copy}</p></section>`;
}

function renderHome() {
  app.innerHTML = `${headerMarkup("НЭЭЛТТЭЙ СУРГАЛТЫН ТӨВ", "Нэг index биш. <em>Таван тусдаа</em> кодын зам.", "HTML, CSS, JavaScript, Python, GitHub бүрийн tag, property, keyword, command нь өөрийн lesson, жишээ, exercise, сорилтой. Бүх хичээл шууд нээлттэй.")}
  <section class="discover" aria-labelledby="discover-title"><p class="eyebrow">ХИЧЭЭЛ ОЛОХ</p><h2 id="discover-title">Сэдвээ олоод шууд эхэл.</h2>
  <label class="search"><span>⌕</span><input id="lesson-search" type="search" placeholder="Жишээ: flex, async, list, branch, README" /></label>
  <div class="filter-group"><strong>Хэл:</strong><div id="language-filters" class="chips"></div></div>
  <div class="filter-group"><strong>Сэдэв:</strong><div id="topic-filters" class="chips"></div></div>
  <p id="result-count" class="result-count"></p><div id="course-grid" class="course-grid"></div></section>
  ${portfolioMarkup()}`;
  let language = "all"; let topic = "all"; let search = "";
  const languageFilters = [{ id: "all", name: "Бүгд" }, ...courses.map(({ id, name }) => ({ id, name }))];
  const topicFilters = [{ id: "all", name: "Бүгд" }, ...courses.map(({ id, topic }) => ({ id, name: topic }))];
  const draw = () => {
    document.querySelector("#language-filters").innerHTML = languageFilters.map((item) => `<button class="chip ${language === item.id ? "selected" : ""}" data-language="${item.id}">${item.name}</button>`).join("");
    document.querySelector("#topic-filters").innerHTML = topicFilters.map((item) => `<button class="chip ${topic === item.id ? "selected" : ""}" data-topic="${item.id}">${item.name}</button>`).join("");
    const visible = courses.filter((course) => (language === "all" || course.id === language) && (topic === "all" || course.id === topic) && `${course.name} ${course.topic} ${course.intro} ${course.lessons.map((lesson) => `${lesson.term} ${lesson.keyword} ${lesson.summary}`).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
    document.querySelector("#result-count").textContent = `${visible.length} сургалтын зам олдлоо`;
    document.querySelector("#course-grid").innerHTML = visible.map((course) => `<article class="course-card" style="--accent:${course.accent}"><p>${course.topic}</p><h3>${course.name}</h3><span>${course.lessons.length} хичээл · ${course.intro}</span><button data-open-course="${course.id}">Замыг нээх →</button></article>`).join("") || `<p class="empty">Энэ хайлтад тохирох lesson олдсонгүй. Өөр keyword туршаарай.</p>`;
  };
  draw();
  document.querySelector("#lesson-search").addEventListener("input", (event) => { search = event.target.value; draw(); });
  app.addEventListener("click", (event) => {
    const lang = event.target.closest("[data-language]"); const top = event.target.closest("[data-topic]"); const course = event.target.closest("[data-open-course]");
    if (lang) { language = lang.dataset.language; draw(); }
    if (top) { topic = top.dataset.topic; draw(); }
    if (course) navigate(`/learn/${course.dataset.openCourse}`);
    const check = event.target.closest("[data-portfolio]");
    if (check) { const values = new Set(getPortfolio()); check.checked ? values.add(check.dataset.portfolio) : values.delete(check.dataset.portfolio); setPortfolio([...values]); renderHome(); }
    if (event.target.closest("#reset-portfolio")) { setPortfolio([]); renderHome(); }
  }, { once: true });
}

function portfolioMarkup() {
  const selected = getPortfolio();
  return `<section class="portfolio"><div><p class="eyebrow">GITHUB PORTFOLIO</p><h2>Portfolio checklist</h2><p>Энэ нь зөвхөн таны browser-д хадгалагдах optional тэмдэглэл. Хичээл үзэх эрхэд нөлөөлөхгүй.</p><button id="reset-portfolio" class="text-button">Тэмдэглэгээг арилгах</button></div><div class="checklist"><p><strong>${selected.length} / ${portfolioItems.length}</strong> бэлэн</p>${portfolioItems.map((item) => `<label><input type="checkbox" data-portfolio="${esc(item)}" ${selected.includes(item) ? "checked" : ""} /> <span>${item}</span></label>`).join("")}</div></section>`;
}

function renderCourse(course) {
  app.innerHTML = `<section class="course-hero" style="--accent:${course.accent}"><a href="#/learn">← Бүх сургалтын зам</a><p class="eyebrow">${course.topic}</p><h1>${course.name}</h1><p>${course.intro} Бүх ${course.lessons.length} lesson нээлттэй — хүссэн сэдвээсээ шууд эхэл.</p><a class="source-link" href="${course.source}" target="_blank" rel="noreferrer">Албан эх сурвалж нээх ↗</a></section><section class="lesson-list"><h2>${course.name} lesson-үүд</h2><div class="lesson-grid">${course.lessons.map((lesson) => `<button class="lesson-node" data-open-lesson="${lesson.id}"><span>${String(lesson.order).padStart(2, "0")}</span><b>${lesson.term}</b><small>${lesson.difficulty} · ${lesson.keyword}</small><i>Нээх →</i></button>`).join("")}</div></section>`;
  app.addEventListener("click", (event) => { const node = event.target.closest("[data-open-lesson]"); if (node) navigate(`/learn/${course.id}/${node.dataset.openLesson}`); }, { once: true });
}

function practiceGuide(course, lesson) {
  const boundary = course.id === "github" ? "Энд бодит terminal, repository, token, network ашиглахгүй. Command-ийн утга ба workflow-г л аюулгүй дадлагажуулна." : course.id === "python" ? "Python код browser доторх Pyodide worker-д ажиллана. Код server рүү илгээгдэхгүй." : course.id === "javascript" ? "JavaScript жишээг browser дотор тусгаарлагдсан орчинд туршина. Код server рүү илгээгдэхгүй." : "Энэ дасгал browser дотор зөвхөн таны нээсэн хуудсанд ажиллана.";
  return `<aside class="practice-guide"><p class="eyebrow">ДАДЛАГЫН ХӨТӨЧ</p><h2>${lesson.term}-ийг аюулгүй турш</h2><p><strong>Энд юу хийх вэ:</strong> Доорх жишээг өөрчилж, үр дүнг ажигла.</p><p><strong>Хязгаар:</strong> ${boundary}</p><p><strong>Дараагийн алхам:</strong> Өөрийн жижиг жишээг үүсгээд албан эх сурвалжийн дэлгэрэнгүйг унш.</p><a href="${lesson.source}" target="_blank" rel="noreferrer">${course.name}-ийн албан баримт ↗</a></aside>`;
}

function sandboxMarkup(course, lesson) {
  const label = course.id === "github" ? "Command simulator" : `${course.name} лаборатори`;
  return `<section class="sandbox" data-language="${course.id}"><div class="section-heading"><p class="eyebrow">ИНТЕРАКТИВ ДАСГАЛ</p><h2>${label}</h2></div><label>Код эсвэл command<textarea id="code-editor" spellcheck="false">${esc(lesson.code)}</textarea></label><div class="sandbox-actions"><button id="run-code" class="primary">Код шалгах</button><button id="reset-code" class="secondary">Жишээг сэргээх</button></div><pre id="code-output" aria-live="polite">Энд үр дүн гарна.</pre></section>`;
}

function renderLesson(course, lesson) {
  app.innerHTML = `<div class="lesson-layout"><aside class="lesson-sidebar"><a href="#/learn/${course.id}">← ${course.name} зам</a><p class="eyebrow">${course.name} · ${lesson.order} / ${course.lessons.length}</p><b>${lesson.difficulty}</b><a href="${lesson.source}" target="_blank" rel="noreferrer">Эх сурвалж ↗</a></aside><article class="lesson-content"><p class="eyebrow">KEYWORD · ${lesson.keyword}</p><h1>${lesson.term}</h1><p class="lead">${lesson.summary}</p><section class="code-example"><p class="eyebrow">КОДЫН ЖИШЭЭ</p><pre><code>${esc(lesson.code)}</code></pre></section>${sandboxMarkup(course, lesson)}${practiceGuide(course, lesson)}${quizMarkup(lesson)}</article></div>`;
  bindSandbox(course, lesson); bindQuiz(lesson);
}

function quizMarkup(lesson) {
  return `<section class="quiz" id="lesson-quiz"><div class="section-heading"><p class="eyebrow">МЭДЛЭГ ШАЛГАХ</p><h2>10 асуулттай сорил</h2><span id="quiz-count">1 / 10</span></div><div id="quiz-dots" class="quiz-dots"></div><div id="quiz-question"></div></section>`;
}

function bindSandbox(course, lesson) {
  const editor = document.querySelector("#code-editor"); const output = document.querySelector("#code-output");
  document.querySelector("#reset-code").onclick = () => { editor.value = lesson.code; output.textContent = "Жишээг сэргээв."; };
  document.querySelector("#run-code").onclick = async () => {
    const code = editor.value.trim();
    if (!code) { output.textContent = "Код бичнэ үү."; return; }
    if (course.id === "github") { output.textContent = /git\s+(status|add|commit|push|pull|switch)/.test(code) ? "✓ Command бүтэц танигдлаа. Бодит repository эсвэл token ашиглаагүй." : "Git command жишээ оруулна уу: git status эсвэл git commit гэх мэт."; return; }
    if (course.id === "html") { output.textContent = /<[^>]+>/.test(code) ? "✓ HTML structure танигдлаа. Жишээг доорх source link-ээр гүнзгийрүүлж уншаарай." : "HTML element оруулна уу."; return; }
    if (course.id === "css") { output.textContent = /[{][\s\S]*[}]/.test(code) ? "✓ CSS rule танигдлаа. Selector болон property-г шалгаарай." : "Selector { property: value; } хэлбэрийн CSS rule оруулна уу."; return; }
    if (course.id === "javascript") { try { const logs = []; const fakeConsole = { log: (...args) => logs.push(args.join(" ")) }; Function("console", `"use strict"; ${code}`)(fakeConsole); output.textContent = `✓ JavaScript ажиллалаа${logs.length ? `\n${logs.join("\n")}` : ""}`; } catch (error) { output.textContent = `Алдаа: ${error.message}`; } return; }
    output.textContent = "Python runtime ачаалж байна…";
    try { if (!window.pyodide) { await new Promise((resolve, reject) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js"; s.onload = resolve; s.onerror = reject; document.head.append(s); }); window.pyodide = await window.loadPyodide(); } const result = await window.pyodide.runPythonAsync(code); output.textContent = `✓ Python ажиллалаа${result !== undefined ? `\n${result}` : ""}`; } catch (error) { output.textContent = `Алдаа: ${error.message}`; }
  };
}

function bindQuiz(lesson) {
  let step = 0; let answers = [];
  const draw = () => { const question = lesson.quiz[step]; document.querySelector("#quiz-count").textContent = `${step + 1} / ${lesson.quiz.length}`; document.querySelector("#quiz-dots").innerHTML = lesson.quiz.map((_, index) => `<span class="${index === step ? "active" : answers[index] !== undefined ? "done" : ""}"></span>`).join(""); document.querySelector("#quiz-question").innerHTML = `<p class="question-kind">${question.kind.toUpperCase()}</p><h3>${question.question}</h3><div class="choices">${question.choices.map((choice, index) => `<button data-answer="${index}">${esc(choice)}</button>`).join("")}</div>`; document.querySelectorAll("[data-answer]").forEach((button) => button.onclick = () => { answers[step] = Number(button.dataset.answer); if (step + 1 < lesson.quiz.length) { step += 1; draw(); } else result(); }); };
  const result = () => { const score = answers.filter((answer, index) => answer === lesson.quiz[index].correct).length; document.querySelector("#quiz-question").innerHTML = `<div class="quiz-result"><p class="eyebrow">СОРИЛ ДУУССАН</p><h3>${score} / ${lesson.quiz.length}</h3><p>Асуулт бүрийн тайлбарыг уншаад, хэрэгтэй бол дахин оролдоорой.</p><div class="review">${lesson.quiz.map((question, index) => `<p><b>${index + 1}. ${question.kind}</b> — ${question.explanation}</p>`).join("")}</div><button id="retry-quiz" class="primary">Дахин оролдох</button></div>`; document.querySelector("#retry-quiz").onclick = () => { step = 0; answers = []; draw(); }; };
  draw();
}

function renderNotFound() { app.innerHTML = `${headerMarkup("404", "Энэ хуудас олдсонгүй.", "Нүүр хуудас руу буцаад хичээлээ сонгоорой.")}<p class="center"><a class="primary link-button" href="#/learn">Хичээлүүдийг харах</a></p>`; }
function router() { const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean); if (!parts.length || parts[0] === "learn" && parts.length === 1) return renderHome(); if (parts[0] === "learn" && parts.length === 2) { const course = findCourse(parts[1]); return course ? renderCourse(course) : renderNotFound(); } if (parts[0] === "learn" && parts.length === 3) { const course = findCourse(parts[1]); const lesson = findLesson(parts[1], parts[2]); return course && lesson ? renderLesson(course, lesson) : renderNotFound(); } renderNotFound(); }
window.addEventListener("hashchange", router); window.addEventListener("DOMContentLoaded", router); router();
