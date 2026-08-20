# CodeCraft Academy vanilla frontend

This folder is the framework-free frontend for the requested HTML, CSS, and JavaScript stack. The document shell is in `index.html`, runtime configuration is in `config.js`, styles are in `assets/css/`, and application logic is in `assets/js/`. It provides the CodeCraft dashboard, curriculum, profile, and interactive workspace routes.

## Run locally

Serve the folder over HTTP so browser modules, iframe previews, and Supabase redirects work consistently:

```bash
cd frontend
python3 -m http.server 5500
```

For local authentication, place the public Supabase URL and anon key in the ignored `config.local.js`; `index.html` loads it after the tracked `config.js` defaults. Do not put the Supabase service-role key in this folder. The local backend reads its values from `backend/.env`.

