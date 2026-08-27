import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { jsAssertions, pythonAssertions, pythonExpectedOutput } from "../components/LessonChallenge";

const jsFixtures: Record<string, string> = {
  "js-values": "const course='JavaScript'; let xp=20; const isReady=true;",
  "js-control-flow": "const score=72; if(score >= 70){ console.log('pass'); } else { console.log('retry'); }",
  "js-functions-arrays": "const lessons=['HTML']; function formatLesson(name){ return `Lesson: ${name}`; } lessons.map(formatLesson);",
  "js-objects-modules": "const learner={name:'Naraa',level:2}; const { name, level } = learner; console.log(name, level);",
  "js-dom-events": "const button=document.querySelector('#check'); const result=document.querySelector('#result'); button.addEventListener('click',()=>{result.textContent='Зөв!';});",
  "js-async-errors": "async function load(){ const response=await fetch('/lesson'); if(!response.ok) throw new Error('failed'); return await response.json(); }",
};

async function runJsAssertion(code: string, assertion: string) {
  const logs: string[] = [];
  const nodes: Record<string, { textContent: string; addEventListener: (type: string, callback: (event: { preventDefault: () => void }) => void) => void; classList: { add: () => void; remove: () => void; toggle: () => void } }> = {};
  const document = { __nodes: nodes, querySelector: (selector: string) => nodes[selector] ?? (nodes[selector] = { textContent: "", addEventListener: (type, callback) => { if (type === "click") callback({ preventDefault: () => undefined }); }, classList: { add: () => undefined, remove: () => undefined, toggle: () => undefined } }), querySelectorAll: () => [] };
  const fetch = async () => ({ ok: true, json: async () => ({ lesson: "ok" }) });
  const runner = new Function("console", "document", "fetch", `return (async()=>{${code}; ${assertion}; return true;})()`);
  await runner({ log: (...args: unknown[]) => logs.push(args.join(" ")), error: (...args: unknown[]) => logs.push(args.join(" ")), __logs: logs }, document, fetch);
}

describe("JavaScript challenge behavior assertions", () => {
  it("accepts correct output/state behavior for every JavaScript challenge", async () => {
    for (const [id, code] of Object.entries(jsFixtures)) await expect(runJsAssertion(code, jsAssertions[id])).resolves.toBeUndefined();
  });
});

const pythonFixtures: Record<string, string> = {
  "py-syntax-values": "name = 'Naraa'\nlevel = 1\nis_ready = True",
  "py-collections": "topics = ['HTML', 'CSS']\ntopics.append('Python')\nprofile = {'name': 'Naraa'}",
  "py-control-flow": "score = 72\nif score >= 70:\n    outcome = 'pass'\nelse:\n    outcome = 'retry'\nprint(outcome)\nfor number in range(1, 4):\n    print(number)",
  "py-functions": "scores = [40,70,88]\ndef is_passed(score):\n    return score >= 70\npassed = [score for score in scores if is_passed(score)]",
  "py-modules-files": "with open('notes.txt', encoding='utf-8') as file:\n    content = file.read()\nprint(content)",
  "py-errors-classes": "class Learner:\n    def __init__(self, name):\n        self.name = name\n        self.xp = 0\n    def add_xp(self, amount):\n        if amount < 0:\n            raise ValueError('XP')\n        self.xp += amount",
};

describe("Python challenge behavior assertions", () => {
  it("accepts correct runtime behavior for every Python challenge", () => {
    for (const [id, code] of Object.entries(pythonFixtures)) {
      const setup = id === "py-modules-files" ? "with open('notes.txt', 'w', encoding='utf-8') as file:\n    file.write('CodeCraft')\n" : "";
      const output = execFileSync("python3", ["-c", `${setup}\n${code}\n${pythonAssertions[id]}`], { encoding: "utf8" });
      (pythonExpectedOutput[id] ?? []).forEach((expected) => expect(output).toContain(expected));
    }
  });
});
