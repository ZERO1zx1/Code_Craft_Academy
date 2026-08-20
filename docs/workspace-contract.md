# CodeCraft Workspace Contract

The workspace is a shared learning surface for Python, HTML, CSS, and JavaScript. The selected course is sent as `courseId` to the protected `tutor.ask` procedure, together with the lesson title, learner question, and current code. The tutor answers in Mongolian with an explanation, one guided hint, and one small next step; it must not execute or recommend unsafe code. Loading, authentication, empty-question, and retry states are visible in the interface.

The HTML mode renders learner markup inside a sandboxed iframe. The CSS mode renders learner CSS with the standard HTML starter structure. JavaScript mode runs inside a sandboxed iframe, captures `console.log`, and reports uncaught or thrown errors in the output panel. Python mode loads Pyodide in the sandboxed iframe, captures `print` output, and reports runtime failures as Python errors. The editor never sends code to the tutor until the learner submits a question, and the tutor endpoint is protected by authentication.

The four modes are intentionally separate runtime paths but share the same editor controls, reset behavior, live preview panel, output/error panel, and AI tutor contract. Runtime output is local to the preview session; learner progress and achievements are persisted through the authenticated progress API and database tables.
