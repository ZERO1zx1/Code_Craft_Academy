import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { courses } from "../client/javascript/curriculum.js";

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
