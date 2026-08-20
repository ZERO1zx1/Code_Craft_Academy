(() => {
  "use strict";

  const config = window.CODECRAFT_CONFIG || {};
  const apiBase = String(config.API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  const courses = [
    { id: "python", label: "Python", eyebrow: "Суурь ойлголтууд", title: "Python-оо бодитоор ойлго", description: "Keyword бүрийг цээжлэх бус, кодын урсгалыг уншиж сэтгэх дадлыг бий болгоно.", lessons: "Python-ийн хичээлүүд", icon: "Py", next: "if ба нөхцөлийн дараалал", starter: "name = 'CodeCraft'\nprint(f'Сайн байна уу, {name}!')" },
    { id: "html", label: "HTML", eyebrow: "Вэбийн бүтэц", title: "Вэбийн суурийг зөв байгуул", description: "Semantic бүтэц, accessibility болон бодит page бүтээнэ.", lessons: "HTML-ийн хичээлүүд", icon: "<>" , next: "Semantic HTML бүтэц", starter: "<main>\n  <h1>Миний анхны вэб</h1>\n  <p>HTML-ээр бүтэц үүсгэлээ.</p>\n</main>" },
    { id: "css", label: "CSS", eyebrow: "Харагдацын систем", title: "Дизайныг код болгон бүтээ", description: "Layout, responsive систем, animation, design token-оор UI-г системтэй зурна.", lessons: "CSS-ийн хичээлүүд", icon: "#", next: "Flexbox card grid", starter: ".card {\n  padding: 24px;\n  border-radius: 16px;\n  color: #402080;\n  background: #f1edff;\n}" },
    { id: "javascript", label: "JavaScript", eyebrow: "Вэбийн үйлдэл", title: "Интерактив вэбийг амилуул", description: "DOM, event, async/API, module болон жижиг бүтээгдэхүүнээр сурна.", lessons: "JavaScript-ийн хичээлүүд", icon: "JS", next: "Event listener ба UI state", starter: "const button = document.querySelector('button');\nbutton?.addEventListener('click', () => {\n  console.log('Товч дарагдлаа!');\n});\nconsole.log('JavaScript ажиллаж байна');" }
  ];

  const state = {
    user: null,
    session: null,
    progress: {},
    activeCourse: new URLSearchParams(location.search).get("course") || "python",
    workspaceLanguage: new URLSearchParams(location.search).get("course") || "python"
  };

  const supabaseClient = window.supabase && config.SUPABASE_URL && config.SUPABASE_ANON_KEY
    ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    : null;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  const currentCourse = () => courses.find((course) => course.id === state.activeCourse) || courses[0];
  const currentUserName = () => state.user?.user_metadata?.display_name || state.user?.user_metadata?.full_name || state.user?.email?.split("@")[0] || "суралцагч";

  async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = state.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${apiBase}${path}`, { ...options, headers });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `API error ${response.status}`);
    }
    return response.status === 204 ? null : response.json();
  }

  async function loadProgress() {
    try {
      const rows = await api("/api/progress");
      state.progress = Object.fromEntries((rows || []).map((row) => [row.course_id || row.courseId, Number(row.progress_percent ?? row.progressPercent ?? 0)]));
    } catch {
      state.progress = JSON.parse(localStorage.getItem("codecraft-progress") || "{}");
    }
  }

  async function updateProgress(courseId, value) {
    state.progress[courseId] = Math.max(0, Math.min(100, Number(value)));
    localStorage.setItem("codecraft-progress", JSON.stringify(state.progress));
    try { await api("/api/progress", { method: "POST", body: JSON.stringify({ course_id: courseId, progress_percent: state.progress[courseId] }) }); } catch { /* local progress remains usable without a configured API */ }
  }

  function showToast(message) {
    const existing = document.querySelector(".cc-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "cc-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }

  function header(active = "home") {
    const name = currentUserName();
    const initial = esc(name.slice(0, 1).toUpperCase());
    return `<header class="cc-header"><div class="cc-header-inner">
      <a class="cc-brand" href="/"><span class="cc-brand-mark">&gt;_</span><span>CodeCraft<small>Academy</small></span></a>
      <nav class="cc-nav" aria-label="Үндсэн цэс">
        <a class="${active === "home" ? "is-active" : ""}" href="/">Миний замнал</a>
        <a class="${active === "curriculum" ? "is-active" : ""}" href="/curriculum">Хичээлүүд</a>
        <a class="${active === "workspace" ? "is-active" : ""}" href="/workspace">Кодын орчин</a>
        <a class="${active === "profile" ? "is-active" : ""}" href="/profile">Профайл</a>
      </nav>
      <div class="cc-header-actions">
        <button class="cc-menu" id="mobile-menu" aria-label="Цэс нээх">☰</button>
        ${state.user ? `<a class="cc-profile" href="/profile"><span class="cc-profile-copy">${esc(name)}</span><span class="cc-avatar">${initial}</span></a>` : `<button class="cc-login" id="login-button">Нэвтрэх</button>`}
      </div>
    </div></header>`;
  }

  function footer() { return `<footer class="cc-footer">CodeCraft Academy · Python, HTML, CSS, JavaScript · FastAPI + Supabase</footer>`; }

  function page(content, active) {
    document.querySelector("#app").innerHTML = `<div class="cc-app">${header(active)}<main class="cc-main">${content}</main>${footer()}</div>`;
    wireGlobalEvents();
  }

  function wireGlobalEvents() {
    document.querySelector("#login-button")?.addEventListener("click", signIn);
    document.querySelector("#mobile-menu")?.addEventListener("click", () => showToast("Мобайл цэсийг дэлгэцийн өргөн багасахад ашиглана уу."));
    document.querySelectorAll("[data-course]").forEach((button) => button.addEventListener("click", () => {
      state.activeCourse = button.dataset.course;
      renderHome();
    }));
    document.querySelectorAll("[data-action='start-workspace']").forEach((button) => button.addEventListener("click", () => navigate(`/workspace?course=${encodeURIComponent(state.activeCourse)}`)));
  }

  async function signIn() {
    if (!supabaseClient) {
      showToast("Supabase тохиргоо алга. frontend/config.js файлд URL болон anon key оруулна уу.");
      return;
    }
    const email = window.prompt("Нэвтрэх email хаягаа оруулна уу:");
    if (!email) return;
    const { error } = await supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) showToast(error.message); else showToast("Нэвтрэх холбоос таны email рүү илгээгдлээ.");
  }

  async function signOut() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    state.user = null; state.session = null; renderHome();
  }

  function courseCard(course) {
    const progress = Number(state.progress[course.id] || 0);
    return `<article class="cc-course ${state.activeCourse === course.id ? "is-selected" : ""}">
      <button data-course="${course.id}" style="display:block;width:100%;border:0;background:none;padding:0;text-align:left">
        <div class="cc-course-top"><span class="cc-course-icon ${course.id}">${course.icon}</span><span class="cc-free">ҮНЭГҮЙ</span></div>
        <h3>${esc(course.label)} <span>/ ${esc(course.title)}</span></h3>
        <p>${esc(course.description)}</p>
        <div class="cc-course-meta"><span>${esc(course.lessons)}</span><span>${progress}%</span></div>
        <div class="cc-progress" aria-label="${progress}% ахиц"><span style="width:${progress}%"></span></div>
      </button>
      <div class="cc-course-actions"><a href="/curriculum?course=${course.id}">Хөтөлбөр</a><a href="/workspace?course=${course.id}">Код бичих</a></div>
    </article>`;
  }

  function renderHome() {
    const course = currentCourse();
    const overall = Math.round(courses.reduce((sum, item) => sum + Number(state.progress[item.id] || 0), 0) / courses.length);
    const name = esc(currentUserName().split(" ")[0]);
    page(`<section class="cc-hero">
      <div>
        <p class="cc-eyebrow">${state.user ? `Сайн байна уу, ${name}` : "CodeCraft Academy"}</p>
        <h1 class="cc-title">Өнөөдөр юу бүтээх вэ?</h1>
        <p class="cc-lede">${state.user ? "Сурах замналаа хадгалагдсан бодит ахицаар үргэлжлүүлээрэй." : "Нэвтэрч орсноор ахиц, амжилтын тэмдэг, сертификатаа хадгалж эхлээрэй."}</p>
        <div class="cc-lab" style="margin-top:28px"><p class="cc-kicker" style="color:#c4b5fd">${state.user ? "ТАНЫ ДАРААГИЙН ХИЧЭЭЛ" : "СУРГАЛТЫН ЗАМНАЛ"}</p><h2>${esc(course.label)}-ийн<br>${esc(course.next)}.</h2><p>Жишээ кодоо кодын орчинд ажиллуулаад, гацсан үедээ алхамчилсан чиглэл аваарай.</p><div class="cc-lab-actions"><button class="cc-primary" data-action="start-workspace">▶ Кодын орчин нээх</button><a class="cc-lab-link" href="/curriculum">Хичээлийн хөтөлбөр →</a></div></div>
      </div>
      <aside class="cc-side-card"><p class="cc-kicker">Таны ахиц</p><h3>${overall}% дууссан</h3><p>Дөрвөн суурь технологийг сууриас бодит төсөл хүртэл судлаарай.</p><div class="cc-progress"><span style="width:${overall}%"></span></div><div class="cc-progress-meta"><span>Эхлэл</span><span>${overall}%</span><span>Бүтээгч</span></div><hr style="border:0;border-top:1px solid var(--line);margin:24px 0"><p class="cc-kicker">Хурдан холбоос</p><a class="cc-secondary" style="display:inline-block;margin-top:3px" href="/workspace">Кодын орчин руу очих</a></aside>
    </section>
    <section class="cc-section"><div class="cc-section-head"><div><h2>Сургалтын замнал <span class="cc-free" style="vertical-align:middle">4 КУРС · ҮНЭГҮЙ</span></h2><p class="cc-section-intro">Python, HTML, CSS, JavaScript — сууриас бодит төсөл хүртэл бүрэн нээлттэй.</p></div><a class="cc-secondary" href="/curriculum">Бүгдийг харах</a></div><div class="cc-courses">${courses.map(courseCard).join("")}</div></section>`, "home");
  }

  function renderCurriculum() {
    page(`<section class="cc-page-card"><p class="cc-eyebrow">Сургалтын каталог</p><h1>Сууриас бүтээл хүртэл</h1><p>Дөрвөн курсийг дарааллаар эсвэл өөрийн сонирхсон хэлээр эхлүүлээрэй. Хичээл бүр кодын жишээ, дадлага, жижиг төсөлтэй.</p><div class="cc-course-list">${courses.map((course) => `<div class="cc-course-row"><div><strong>${course.icon} ${esc(course.label)}</strong><span>${esc(course.description)}</span></div><a class="cc-primary" href="/workspace?course=${course.id}">Эхлэх</a></div>`).join("")}</div></section>`, "curriculum");
  }

  function buildPreview(language, code) {
    const course = courses.find((item) => item.id === language) || courses[0];
    const htmlStarter = courses.find((item) => item.id === "html").starter;
    const cssStarter = courses.find((item) => item.id === "css").starter;
    const escaped = String(code).replace(/<\/script/gi, "<\\/script");
    if (language === "html") return `<style>${cssStarter}</style>${escaped}`;
    if (language === "css") return `<style>${escaped}</style>${htmlStarter}`;
    if (language === "javascript") return `<main style="padding:20px;font-family:system-ui"><h2>JavaScript output</h2><pre id="out"></pre></main><script>const out=document.getElementById('out');console.log=(...args)=>out.textContent+=args.join(' ')+'\\n';window.onerror=(message)=>out.textContent+='JavaScript error: '+message;try{${escaped}}catch(error){out.textContent+='JavaScript error: '+error.message}</script>`;
    const pythonCode = JSON.stringify(code);
    const workerSource = `importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');let ready=loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'});self.onmessage=async()=>{try{const pyodide=await ready;const wrapped=${JSON.stringify("import io, contextlib\n_output=io.StringIO()\nwith contextlib.redirect_stdout(_output):\n    exec(" + pythonCode + ", globals())\n_output.getvalue()")};const result=await pyodide.runPythonAsync(wrapped);self.postMessage({ok:true,result:String(result??'')});}catch(error){self.postMessage({ok:false,error:String(error?.message||error)});}};`;
    return `<main style="padding:20px;font-family:system-ui"><h2>Python output</h2><pre id="out">Python runtime ачаалж байна...</pre></main><script>(()=>{const out=document.getElementById('out');try{const worker=new Worker(URL.createObjectURL(new Blob([${JSON.stringify(workerSource)}],{type:'text/javascript'})));worker.onmessage=(event)=>{out.textContent=event.data.ok?event.data.result:('Python error: '+event.data.error);worker.terminate()};worker.onerror=(event)=>{out.textContent='Python error: '+event.message;worker.terminate()};worker.postMessage(null)}catch(error){out.textContent='Python error: '+error.message}})()</script>`;
  }

  function renderWorkspace() {
    const course = courses.find((item) => item.id === state.workspaceLanguage) || courses[0];
    const saved = localStorage.getItem(`codecraft-code-${course.id}`) || course.starter;
    page(`<section><p class="cc-eyebrow">Интерактив кодын лаборатори</p><h1 class="cc-title" style="font-size:clamp(32px,4vw,48px)">${esc(course.label)}-ээр туршиж үзье</h1><p class="cc-lede">Кодоо ажиллуулаад гаралт эсвэл live preview-г баруун талд хараарай. Python нь Pyodide worker дотор тусгаарлагдана.</p><div class="cc-workspace"><aside class="cc-panel"><h2>Хэл сонгох</h2><div class="cc-language-tabs" style="margin-top:16px">${courses.map((item) => `<button class="cc-language-tab ${item.id === course.id ? "is-active" : ""}" data-language="${item.id}">${item.icon} ${item.label}</button>`).join("")}</div><label for="lesson-progress">Хичээлийн ахиц</label><input id="lesson-progress" class="cc-field" type="range" min="0" max="100" value="${state.progress[course.id] || 0}"><div class="cc-progress-meta"><span>Ахиц</span><strong id="progress-value">${state.progress[course.id] || 0}%</strong></div></aside><section class="cc-panel"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><h2>Код засварлагч</h2><button class="cc-primary" id="run-code">▶ Ажиллуулах</button></div><textarea id="code-editor" class="cc-editor" spellcheck="false" aria-label="Код засварлагч">${esc(saved)}</textarea><p id="editor-status" style="margin:10px 0 0;color:var(--muted);font-size:12px">${state.user ? "Таны ахиц FastAPI + Supabase руу хадгалагдана." : "Нэвтрээгүй үед код localStorage-д хадгалагдана."}</p></section><section class="cc-panel cc-preview-panel"><h2>Үр дүн</h2><iframe id="preview" class="cc-preview" sandbox="allow-scripts" title="Кодын preview"></iframe><pre id="fallback-output" class="cc-output" hidden></pre></section></div></section>`, "workspace");
    const editor = document.querySelector("#code-editor");
    const preview = document.querySelector("#preview");
    const progress = document.querySelector("#lesson-progress");
    const progressValue = document.querySelector("#progress-value");
    const render = () => { preview.srcdoc = buildPreview(course.id, editor.value); localStorage.setItem(`codecraft-code-${course.id}`, editor.value); };
    render();
    document.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", () => { state.workspaceLanguage = button.dataset.language; navigate(`/workspace?course=${button.dataset.language}`); }));
    document.querySelector("#run-code").addEventListener("click", () => { render(); showToast(`${course.label} код ажиллууллаа.`); });
    editor.addEventListener("input", () => localStorage.setItem(`codecraft-code-${course.id}`, editor.value));
    progress.addEventListener("input", async () => { progressValue.textContent = `${progress.value}%`; await updateProgress(course.id, progress.value); });
  }

  function renderProfile() {
    const name = currentUserName();
    page(`<section class="cc-page-card"><p class="cc-eyebrow">Суралцагчийн профайл</p><h1>${esc(name)}</h1><p>${state.user ? esc(state.user.email || "Supabase хэрэглэгч") : "Нэвтрээгүй зочин"}</p><div class="cc-course-list">${courses.map((course) => `<div class="cc-course-row"><div><strong>${course.label}</strong><span>Хадгалсан ахиц</span></div><strong>${Number(state.progress[course.id] || 0)}%</strong></div>`).join("")}</div>${state.user ? `<button class="cc-secondary" id="sign-out" style="margin-top:20px">Гарах</button>` : `<button class="cc-primary" id="profile-login" style="margin-top:20px">Нэвтрэх</button>`}</section>`, "profile");
    document.querySelector("#sign-out")?.addEventListener("click", signOut);
    document.querySelector("#profile-login")?.addEventListener("click", signIn);
  }

  function renderNotFound() { page(`<section class="cc-page-card"><p class="cc-eyebrow">404</p><h1>Энэ хуудас олдсонгүй.</h1><p>CodeCraft Academy-ийн нүүр хуудас руу буцаж очно уу.</p><a class="cc-primary" style="display:inline-block;margin-top:10px" href="/">Нүүр хуудас</a></section>`, ""); }

  function navigate(path) { history.pushState({}, "", path); renderRoute(); }
  function renderRoute() {
    const path = window.location.pathname;
    if (path === "/" || path === "") return renderHome();
    if (path === "/curriculum") return renderCurriculum();
    if (path === "/workspace") return renderWorkspace();
    if (path === "/profile") return renderProfile();
    return renderNotFound();
  }

  async function bootstrap() {
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      state.session = data.session;
      state.user = data.session?.user || null;
      supabaseClient.auth.onAuthStateChange((_event, session) => { state.session = session; state.user = session?.user || null; renderRoute(); });
    }
    await loadProgress();
    window.addEventListener("popstate", renderRoute);
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link || link.origin !== window.location.origin || link.target === "_blank" || link.getAttribute("href").startsWith("#")) return;
      event.preventDefault(); navigate(link.getAttribute("href"));
    });
    renderRoute();
  }

  bootstrap().catch((error) => { document.querySelector("#app").innerHTML = `<main class="cc-main"><section class="cc-page-card"><h1>Ачааллахад алдаа гарлаа</h1><p>${esc(error.message)}</p></section></main>`; });
})();

