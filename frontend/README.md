# CodeCraft Academy vanilla frontend

This folder is the framework-free frontend for the requested HTML, CSS, and JavaScript stack. The document shell is in `index.html`, runtime configuration is in `config.js`, styles are in `assets/css/`, and application logic is in `assets/js/`.

The learning experience now includes:

- 57 step-by-step lessons across Python, HTML, CSS, and JavaScript;
- a four-stage frontend developer roadmap and four portfolio projects;
- course, module, and individual lesson views;
- offline-first lesson completion and progress tracking;
- an interactive HTML/CSS/JavaScript/Python workspace;
- a clearly locked `Premium · Coming soon` backend path.

Client-side routes include `/`, `/curriculum`, `/course`, `/lesson`, `/workspace`, and `/profile`. Production static hosting should rewrite unknown routes to `index.html` so direct links and refreshes keep working.

## Run locally

Serve the folder over HTTP so browser modules, iframe previews, and Supabase redirects work consistently:

```bash
cd frontend
python3 -m http.server 5500
```

For local authentication, place the public Supabase URL and anon key in the ignored `config.local.js`; `index.html` loads it after the tracked `config.js` defaults. Do not put the Supabase service-role key in this folder. The local backend reads its values from `backend/.env`.

