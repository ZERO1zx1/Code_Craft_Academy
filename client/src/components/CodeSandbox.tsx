/** Code Atlas Editorial: an intentionally focused browser lab for JavaScript and Python experiments. */
import { Braces, Code2, Copy, Play, RotateCcw, TerminalSquare } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sandboxStarter } from "@/lib/courseData";

type LabLanguage = "javascript" | "python";

function buildJavascriptDocument(code: string, token: string) {
  const safeCode = code.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><body><script>const token=${JSON.stringify(token)};const lines=[];const send=(payload)=>parent.postMessage({source:"codecraft-js",token,...payload},"*");const capture=(...args)=>lines.push(args.map((item)=>typeof item==="string"?item:JSON.stringify(item)).join(" "));console.log=capture;console.warn=capture;console.error=capture;window.onerror=(message)=>send({error:String(message),output:lines.join("\\n")});(async()=>{try{const result=await (async()=>{${safeCode}\n})();if(result!==undefined)capture(result);send({output:lines.join("\\n")||"Код алдаагүй дууслаа."});}catch(error){send({error:error?.message||String(error),output:lines.join("\\n")});}})();<\/script></body></html>`;
}

export function CodeSandbox() {
  const [language, setLanguage] = useState<LabLanguage>("javascript");
  const [code, setCode] = useState<string>(sandboxStarter.javascript);
  const [output, setOutput] = useState("// Console энд харагдана");
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [jsDocument, setJsDocument] = useState("");
  const pythonWorker = useRef<Worker | null>(null);
  const runId = useRef(0);
  const jsToken = useRef("");

  useEffect(() => {
    function handleMessage(event: MessageEvent<{ source?: string; token?: string; output?: string; error?: string }>) {
      if (event.data?.source !== "codecraft-js" || event.data.token !== jsToken.current) return;
      setStatus(event.data.error ? "error" : "idle");
      setOutput(event.data.error ? `${event.data.output ? `${event.data.output}\n\n` : ""}Error: ${event.data.error}` : event.data.output || "Код алдаагүй дууслаа.");
    }
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      pythonWorker.current?.terminate();
    };
  }, []);

  function switchLanguage(next: LabLanguage) {
    setLanguage(next);
    setCode(sandboxStarter[next]);
    setOutput("// Console энд харагдана");
    setStatus("idle");
  }

  function runPython() {
    const id = ++runId.current;
    if (!pythonWorker.current) {
      pythonWorker.current = new Worker(new URL("../workers/python-worker.ts", import.meta.url), { type: "module" });
      pythonWorker.current.onmessage = (event: MessageEvent<{ id: number; output?: string; error?: string }>) => {
        if (event.data.id !== runId.current) return;
        setStatus(event.data.error ? "error" : "idle");
        setOutput(event.data.error ? `Error: ${event.data.error}` : event.data.output || "Код алдаагүй дууслаа.");
      };
      pythonWorker.current.onerror = () => { setStatus("error"); setOutput("Python лабораторийг эхлүүлэхэд алдаа гарлаа. Сүлжээгээ шалгаад дахин оролдоорой."); };
    }
    pythonWorker.current.postMessage({ id, code });
  }

  function runCode() {
    setStatus("running");
    setOutput(language === "python" ? "Python орчинг бэлтгэж байна..." : "Кодыг тусгаарлагдсан орчинд ажиллуулж байна...");
    if (language === "python") {
      runPython();
      return;
    }
    const token = crypto.randomUUID();
    jsToken.current = token;
    setJsDocument(buildJavascriptDocument(code, token));
  }

  return (
    <section className="sandbox-lab">
      <div className="sandbox-heading"><div><p className="section-kicker">ИНТЕРАКТИВ ЛАБОРАТОРИ</p><h3>Кодоо шууд турш.</h3><p>JavaScript тусгаарлагдсан iframe-д, Python браузерын Web Worker-д ажиллана. Серверт таны код хадгалагдахгүй.</p></div><TerminalSquare /></div>
      <div className="sandbox-tabs" role="tablist"><button type="button" role="tab" aria-selected={language === "javascript"} className={language === "javascript" ? "active" : ""} onClick={() => switchLanguage("javascript")}><Braces size={16} /> JavaScript</button><button type="button" role="tab" aria-selected={language === "python"} className={language === "python" ? "active" : ""} onClick={() => switchLanguage("python")}><Code2 size={16} /> Python</button></div>
      <div className="sandbox-workspace"><div className="lab-editor"><div className="lab-bar"><span>{language === "python" ? "experiment.py" : "experiment.js"}</span><button type="button" onClick={() => navigator.clipboard?.writeText(code)} aria-label="Код хуулах"><Copy size={14} /></button></div><Textarea value={code} onChange={(event) => setCode(event.target.value)} aria-label="Лабораторийн код" spellCheck={false} /></div><div className={status === "error" ? "lab-output error" : "lab-output"}><div className="lab-bar"><span>CONSOLE</span><i className={status === "running" ? "running" : ""} /></div><pre>{output}</pre></div></div>
      <div className="sandbox-actions"><Button className="atlas-button" disabled={status === "running"} onClick={runCode}><Play size={16} fill="currentColor" /> {status === "running" ? "Ажиллаж байна..." : "Код ажиллуулах"}</Button><Button variant="ghost" onClick={() => { setCode(sandboxStarter[language]); setOutput("// Console цэвэрлэгдлээ"); setStatus("idle"); }}><RotateCcw size={15} /> Жишээг сэргээх</Button></div>
      {jsDocument && <iframe title="JavaScript sandbox execution" sandbox="allow-scripts" className="sandbox-frame" srcDoc={jsDocument} />}
    </section>
  );
}
