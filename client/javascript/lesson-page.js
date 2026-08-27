const sandbox = document.querySelector(".sandbox");

if (sandbox) {
  const editor = sandbox.querySelector(".code-editor");
  const original = editor.value;
  const output = sandbox.querySelector(".code-output");
  const language = sandbox.dataset.language;

  sandbox.querySelector(".reset-code").onclick = () => {
    editor.value = original;
    output.textContent = "Жишээг сэргээв.";
  };

  sandbox.querySelector(".run-code").onclick = async () => {
    const code = editor.value.trim();
    if (!code) { output.textContent = "Код бичнэ үү."; return; }
    if (language === "html") { output.textContent = /<[^>]+>/.test(code) ? "✓ HTML structure танигдлаа." : "HTML element оруулна уу."; return; }
    if (language === "css") { output.textContent = /{[\s\S]*}/.test(code) ? "✓ CSS rule танигдлаа." : "Selector { property: value; } хэлбэрийн CSS rule оруулна уу."; return; }
    if (language === "github") { output.textContent = /git\s+(status|add|commit|push|pull|switch)/.test(code) ? "✓ Command бүтэц танигдлаа. Бодит repository ашиглаагүй." : "git status эсвэл git commit жишээ оруулна уу."; return; }
    if (language === "javascript") {
      try {
        const logs = [];
        Function("console", `"use strict"; ${code}`)({ log: (...items) => logs.push(items.join(" ")) });
        output.textContent = `✓ JavaScript ажиллалаа${logs.length ? `\n${logs.join("\n")}` : ""}`;
      } catch (error) { output.textContent = `Алдаа: ${error.message}`; }
      return;
    }
    output.textContent = "Python runtime ачаалж байна…";
    try {
      if (!window.pyodide) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js";
          script.onload = resolve; script.onerror = reject; document.head.append(script);
        });
        window.pyodide = await window.loadPyodide();
      }
      await window.pyodide.runPythonAsync(code);
      output.textContent = "✓ Python ажиллалаа";
    } catch (error) { output.textContent = `Алдаа: ${error.message}`; }
  };
}

const questions = [...document.querySelectorAll(".static-question")];
const dots = [...document.querySelectorAll(".quiz-dots span")];
const count = document.querySelector(".quiz-count");
const result = document.querySelector(".quiz-result");
let step = 0;
let score = 0;

function nextQuestion(question, index) {
  question.classList.add("is-hidden");
  step += 1;
  if (step < questions.length) {
    questions[step].classList.remove("is-hidden");
    dots[step].classList.add("active");
    count.textContent = `${step + 1} / ${questions.length}`;
    return;
  }
  count.textContent = `${questions.length} / ${questions.length}`;
  result.classList.remove("is-hidden");
  result.querySelector(".score").textContent = `${score} / ${questions.length}`;
}

questions.forEach((question, index) => {
  question.querySelectorAll("button[data-correct]").forEach((button) => {
    button.onclick = () => {
      if (question.dataset.answered) return;
      question.dataset.answered = "true";
      const correct = button.dataset.correct === "true";
      if (correct) score += 1;
      question.querySelector(".question-feedback").textContent = correct ? "✓ Зөв хариулт" : "Дахин тайлбарыг уншаарай.";
      question.querySelector(".question-explanation").classList.remove("is-hidden");
      dots[index].classList.add("done");
      setTimeout(() => nextQuestion(question, index), 250);
    };
  });
});

document.querySelector(".retry-quiz")?.addEventListener("click", () => location.reload());
