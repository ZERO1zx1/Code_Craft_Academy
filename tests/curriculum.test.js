import test from "node:test";
import assert from "node:assert/strict";
import { courses } from "../client/javascript/curriculum.js";

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
