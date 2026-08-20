import { describe, expect, it } from "vitest";
import { buildPreviewDocument } from "./workspace";

const html = `<main class="card">Hello</main>`;
const css = `.card { color: red; }`;

describe("workspace runtime contract", () => {
  it("renders learner HTML with the CSS starter", () => {
    const document = buildPreviewDocument("html", html, html, css);
    expect(document).toContain("Hello");
    expect(document).toContain("color: red");
  });

  it("renders learner CSS with the HTML starter", () => {
    const document = buildPreviewDocument("css", css, html, css);
    expect(document).toContain("color: red");
    expect(document).toContain("<main class=\"card\">Hello</main>");
  });

  it("wraps JavaScript with console and error capture", () => {
    const document = buildPreviewDocument("javascript", "console.log('ok')", html, css);
    expect(document).toContain("console.log");
    expect(document).toContain("JavaScript error");
    expect(document).toContain("console.log('ok')");
  });

  it("loads Pyodide and captures Python output", () => {
    const document = buildPreviewDocument("python", "print('ok')", html, css);
    expect(document).toContain("pyodide.js");
    expect(document).toContain("runPythonAsync");
    expect(document).toContain("Python error");
  });

  it("escapes closing script tags before embedding learner code", () => {
    const document = buildPreviewDocument("javascript", "</script><script>alert(1)</script>", html, css);
    expect(document).not.toContain("</script><script>alert");
  });
});
