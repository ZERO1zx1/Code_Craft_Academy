export type PythonRuntime = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (config: { batched: (message: string) => void }) => void;
  loadPackagesFromImports: (code: string) => Promise<void>;
};

export type PythonValidationInput = { code: string; setup?: string; assertion?: string; expectedOutput?: string[] };

export async function runPythonChallengeValidation(runtime: PythonRuntime, input: PythonValidationInput) {
  const output: string[] = [];
  runtime.setStdout({ batched: (message) => output.push(message) });
  if (input.setup) await runtime.runPythonAsync(input.setup);
  await runtime.loadPackagesFromImports(input.code);
  const result = await runtime.runPythonAsync(input.code);
  if (result !== undefined && result !== null) output.push(String(result));
  if (input.assertion) await runtime.runPythonAsync(input.assertion);
  const combined = output.join("\n") || "Код алдаагүй дууслаа.";
  const missing = (input.expectedOutput ?? []).filter((expected) => !combined.includes(expected));
  if (missing.length > 0) throw new Error(`Хүлээгдсэн output дутуу байна: ${missing.join(", ")}`);
  return combined;
}
