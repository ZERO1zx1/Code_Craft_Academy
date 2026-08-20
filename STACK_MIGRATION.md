# CodeCraft Academy final stack

The repository now contains only the requested HTML/CSS/JavaScript, Python/FastAPI, and Supabase implementation. The previous React/TypeScript, Express, tRPC, Drizzle, and related legacy files were removed from the repository in the replacement commit.

| Layer | Location | Responsibility |
|---|---|---|
| HTML | `frontend/index.html` | Document shell and external client entry points |
| CSS | `frontend/assets/css/styles.css` | Responsive CodeCraft visual system |
| JavaScript | `frontend/assets/js/app.js` | Client routing, dashboard, workspace, API calls, and Supabase Auth |
| Python | `backend/app/core/`, `backend/app/models/` | Settings, Supabase integration, and Pydantic schemas |
| FastAPI | `backend/app/main.py` | Health, courses, profile, progress, and quiz REST endpoints |
| Supabase | `supabase/migrations/001_codecraft_core.sql` | Profiles, progress, quiz attempts, triggers, and RLS policies |

Local secret files remain outside version control. The public Supabase URL and publishable/anon key may be used in the local frontend configuration, while a service-role key must stay server-side in `backend/.env` and must never be committed.

