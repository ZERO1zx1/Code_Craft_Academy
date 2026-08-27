import { describe, expect, it } from "vitest";
import type { PythonRuntime } from "../lib/pythonChallengeRuntime";
import { createPythonWorkerHandler } from "./python-worker";

function runtime(stdoutValue: string, throwsOnAssertion = false): PythonRuntime {
  let stdout: (message: string) => void = () => undefined;
  return { setStdout: ({ batched }) => { stdout = batched; }, loadPackagesFromImports: async () => undefined, runPythonAsync: async (code) => { if (code === "assert bad") throw new Error("assertion failed"); if (code.includes("print")) stdout(stdoutValue); if (throwsOnAssertion && code.includes("assert")) throw new Error("assertion failed"); return undefined; } };
}

describe("python worker message contract", () => {
  it("posts successful output after forwarding setup, code, assertion, and expected output to the runtime validator", async () => {
    const posted: Array<{ id: number; output?: string; error?: string }> = [];
    const handler = createPythonWorkerHandler(async () => runtime("pass"), (payload) => posted.push(payload));
    await handler({ data: { id: 101, setup: "setup", code: "print('pass')", assertion: "assert True", expectedOutput: ["pass"] } });
    expect(posted).toEqual([{ id: 101, output: "pass" }]);
  });

  it("posts a readable error for missing expected output and assertion failures", async () => {
    const missing: Array<{ id: number; output?: string; error?: string }> = [];
    await createPythonWorkerHandler(async () => runtime("retry"), (payload) => missing.push(payload))({ data: { id: 102, code: "print('retry')", expectedOutput: ["pass"] } });
    expect(missing[0]).toMatchObject({ id: 102, error: expect.stringContaining("Хүлээгдсэн output") });
    const assertion: Array<{ id: number; output?: string; error?: string }> = [];
    await createPythonWorkerHandler(async () => runtime("pass", true), (payload) => assertion.push(payload))({ data: { id: 103, code: "print('pass')", assertion: "assert bad" } });
    expect(assertion[0]).toMatchObject({ id: 103, error: expect.stringContaining("assertion failed") });
  });
});
