import { describe, expect, it } from "vitest";
import { runPythonChallengeValidation, type PythonRuntime } from "./pythonChallengeRuntime";

function fakeRuntime(outputForUserCode: string): PythonRuntime & { calls: string[] } {
  const calls: string[] = [];
  let stdout: (message: string) => void = () => undefined;
  return { calls, setStdout: ({ batched }) => { stdout = batched; }, loadPackagesFromImports: async (code) => { calls.push(`imports:${code}`); }, runPythonAsync: async (code) => { calls.push(code); if (code.includes("print(outcome)")) stdout(outputForUserCode); return undefined; } };
}

describe("Python worker validation runtime", () => {
  it("runs setup, user code, assertion, and validates expected stdout through the worker runtime path", async () => {
    const runtime = fakeRuntime("pass\n1\n2\n3");
    await expect(runPythonChallengeValidation(runtime, { setup: "setup", code: "print(outcome)", assertion: "assert outcome == 'pass'", expectedOutput: ["pass", "1", "2", "3"] })).resolves.toContain("pass");
    expect(runtime.calls).toEqual(["setup", "imports:print(outcome)", "print(outcome)", "assert outcome == 'pass'"]);
  });

  it("rejects when the actual worker stdout misses an expected behavior", async () => {
    const runtime = fakeRuntime("retry");
    await expect(runPythonChallengeValidation(runtime, { code: "print(outcome)", expectedOutput: ["pass"] })).rejects.toThrow("Хүлээгдсэн output");
  });
});
