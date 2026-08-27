import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { courses } from "../client/javascript/data/curriculum.js";

const clientRoot = new URL("../client/", import.meta.url).pathname;
const lessonRoot = join(clientRoot, "lessons");

test("тав тусдаа сургалтын зам 24 lesson-тэй", () => {
  assert.equal(courses.length, 5);
  courses.forEach((course) => assert.equal(course.lessons.length, 24));
});

test("lesson бүр 10 төрлийн асуулттай", () => {
  courses.flatMap((course) => course.lessons).forEach((lesson) => {
    assert.equal(lesson.quiz.length, 10);
    assert.equal(new Set(lesson.quiz.map((question) => question.kind)).size, 10);
  });
});

test("120 lesson нь таван тусдаа folder дахь бодит HTML source файл байна", () => {
  const courseFolders = readdirSync(lessonRoot, { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name).sort();
  assert.deepEqual(courseFolders, ["css", "github", "html", "javascript", "python"]);
  courseFolders.forEach((courseId) => {
    const pages = readdirSync(join(lessonRoot, courseId)).filter((name) => /^\d{2}-.*\.html$/.test(name));
    assert.equal(pages.length, 24, `${courseId} нь 24 lesson HTML file-тэй байх ёстой`);
    pages.forEach((page) => {
      const markup = readFileSync(join(lessonRoot, courseId, page), "utf8");
      assert.match(markup, /class="lesson-content"/);
      assert.match(markup, /class="sandbox"/);
      assert.match(markup, /ДАДЛАГЫН ХӨТӨЧ/);
      assert.match(markup, /Эх сурвалж/);
      assert.match(markup, /ЗУРАГТ ТАЙЛБАР/);
      assert.match(markup, /class="diagram-flow"/);
      assert.match(markup, /class="mini-project"/);
      assert.match(markup, /MINI PROJECT/);
      assert.equal((markup.match(/<li><span>0[123]<\/span>/g) || []).length, 3, `${page} нь mini-project-ийн 3 шаттай байх ёстой`);
      assert.match(markup, /open-project-lab/);
      if (courseId === "github") assert.match(markup, /SIMULATED TERMINAL/);
      else if (courseId === "python") assert.match(markup, /BROWSER PYTHON TERMINAL/);
      else assert.match(markup, /LIVE PREVIEW/);
      assert.equal((markup.match(/class="static-question/g) || []).length, 10, `${page} нь 10 quiz question markup-тэй байх ёстой`);
    });
  });
});

test("repository source нь TypeScript файлгүй, vanilla HTML/CSS/ES-module JavaScript бүтэцтэй", () => {
  const ignored = new Set(["node_modules", "dist", ".git", ".manus", ".manus-logs"]);
  const findings = [];
  const scan = (directory) => readdirSync(directory, { withFileTypes: true }).forEach((item) => {
    if (ignored.has(item.name)) return;
    const fullPath = join(directory, item.name);
    if (item.isDirectory()) scan(fullPath);
    if (item.isFile() && /\.tsx?$/.test(item.name)) findings.push(fullPath);
  });
  scan(new URL("../", import.meta.url).pathname);
  assert.deepEqual(findings, []);
});

test("source tree нь data, page runtime, component style болон documentation-ийг purpose-based folder-т цэгцэлсэн", () => {
  const projectRoot = new URL("../", import.meta.url).pathname;
  const requiredPaths = [
    "client/css/base.css",
    "client/css/components/lesson-pages.css",
    "client/css/components/ui-enhancements.css",
    "client/css/components/mini-project.css",
    "client/css/components/about.css",
    "client/javascript/data/curriculum.js",
    "client/javascript/pages/home.js",
    "client/javascript/pages/lesson-page.js",
    "client/lessons/html/index.html",
    "client/lessons/css/index.html",
    "client/lessons/javascript/index.html",
    "client/lessons/python/index.html",
    "client/lessons/github/index.html",
    "docs/curriculum-inventory.md",
    "docs/figma-design-notes.md",
  ];
  requiredPaths.forEach((path) => assert.doesNotThrow(() => readFileSync(join(projectRoot, path), "utf8"), `${path} байх ёстой`));
});

test("course бүр дэлгэрэнгүй README, About page болон шууд navigation-тэй", () => {
  const projectRoot = new URL("../", import.meta.url).pathname;
  const aboutMarkup = readFileSync(join(projectRoot, "client/about.html"), "utf8");
  assert.match(aboutMarkup, /CodeCraft Academy-ийн тухай/);
  assert.match(aboutMarkup, /2026/);
  assert.match(aboutMarkup, /summer_course_2026/);
  assert.match(aboutMarkup, /Light/);

  courses.forEach((course) => {
    const readme = readFileSync(join(lessonRoot, course.id, "README.md"), "utf8");
    const courseIndex = readFileSync(join(lessonRoot, course.id, "index.html"), "utf8");
    assert.match(readme, /## Агуулгын зам/);
    assert.match(readme, /## Суралцах үр дүн/);
    assert.match(readme, /## Дадлага ба mini-project/);
    assert.match(readme, /## Эх сурвалж/);
    assert.match(courseIndex, /README/);
    assert.match(courseIndex, /Танилцуулга/);
  });
});
