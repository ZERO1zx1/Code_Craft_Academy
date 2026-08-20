export type WorkspaceLanguage = "html" | "css" | "javascript" | "python";

export function buildPreviewDocument(language: WorkspaceLanguage, code: string, htmlStarter: string, cssStarter: string) {
  const escaped = code.replaceAll("</script", "<\\/script");
  if (language === "html") return `<style>${cssStarter}</style>${escaped}`;
  if (language === "css") return `<style>${escaped}</style>${htmlStarter}`;
  if (language === "python") {
    const pythonCode = JSON.stringify(code);
    const pythonWrapper = `import io, contextlib\n_output=io.StringIO()\nwith contextlib.redirect_stdout(_output):\n    exec(${pythonCode}, globals())\n_output.getvalue()`;
    const workerSource = `importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');let ready=loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'});self.onmessage=async()=>{try{const pyodide=await ready;const wrapped=${JSON.stringify(pythonWrapper)};const result=await pyodide.runPythonAsync(wrapped);self.postMessage({ok:true,result:String(result??'')});}catch(error){self.postMessage({ok:false,error:String(error?.message||error)});}};`;
    return `<main><h2>Python output</h2><pre id="out">Python runtime ачаалж байна...</pre></main><script>(()=>{const out=document.getElementById('out');const workerCode=${JSON.stringify(workerSource)};try{const worker=new Worker(URL.createObjectURL(new Blob([workerCode],{type:'text/javascript'})));worker.onmessage=(event)=>{out.textContent=event.data.ok?event.data.result:('Python error: '+event.data.error);worker.terminate();};worker.onerror=(event)=>{out.textContent='Python error: '+event.message;worker.terminate();};worker.postMessage(null);}catch(error){out.textContent='Python error: '+error.message;}})();</script>`;
  }
  return `<main><h2>JavaScript output</h2><pre id="out"></pre></main><script>const out=document.getElementById('out'); console.log=(...args)=>out.textContent += args.join(' ')+'\\n'; window.onerror=(message)=>out.textContent += 'JavaScript error: '+message; try { ${escaped} } catch (error) { out.textContent += 'JavaScript error: '+error.message; }</script>`;
}

// Python нь sandboxed Web Worker дотор ажиллана. Ингэснээр суралцагчийн код үндсэн аппын DOM, cookie, session руу шууд хандахгүй.
