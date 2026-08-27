import { runPythonChallengeValidation, type PythonRuntime } from "../lib/pythonChallengeRuntime";

export type PythonWorkerMessage = { id: number; code: string; setup?: string; assertion?: string; expectedOutput?: string[] };
type WorkerEvent = { data: PythonWorkerMessage };

let runtimePromise: Promise<PythonRuntime> | null = null;
const PYODIDE_URL: string = "https://cdn.jsdelivr.net/pyodide/v314.0.5/full/pyodide.mjs";

async function loadRuntime() {
  if (!runtimePromise) runtimePromise = import(/* @vite-ignore */ PYODIDE_URL).then((module) => module.loadPyodide() as Promise<PythonRuntime>);
  return runtimePromise;
}

export function createPythonWorkerHandler(getRuntime: () => Promise<PythonRuntime>, postMessage: (payload: { id: number; output?: string; error?: string }) => void) {
  return async (event: WorkerEvent) => {
    const { id, code, setup, assertion, expectedOutput } = event.data;
    try {
      const output = await runPythonChallengeValidation(await getRuntime(), { code, setup, assertion, expectedOutput });
      postMessage({ id, output });
    } catch (error) {
      postMessage({ id, error: error instanceof Error ? error.message : "Python код ажиллах үед алдаа гарлаа." });
    }
  };
}

if (typeof self !== "undefined") self.onmessage = createPythonWorkerHandler(loadRuntime, (payload) => self.postMessage(payload));
