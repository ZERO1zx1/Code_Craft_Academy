# CodeCraft Academy stack migration

The requested framework-free stack is now available in dedicated folders without changing the legacy TypeScript implementation in `client/`, `server/`, `shared/`, and `drizzle/`.

| Layer | New location | Responsibility |
|---|---|---|
| HTML | `frontend/index.html` | Document shell and CDN entry points |
| CSS | `frontend/assets/css/styles.css` | Responsive CodeCraft visual system |
| JavaScript | `frontend/assets/js/app.js` | Client routing, course dashboard, workspace, API calls, and Supabase Auth |
| Python | `backend/app/core/`, `backend/app/models/` | FastAPI settings, Supabase integration, and validation schemas |
| FastAPI | `backend/app/main.py` | Health, courses, profile, progress, and quiz REST endpoints |
| Supabase | `supabase/migrations/001_codecraft_core.sql` | Profiles, course progress, quiz attempts, triggers, and RLS policies |

The legacy folders remain untouched so the existing application can be compared, tested, or migrated feature by feature. No Supabase secret is included in the repository. The public anon key belongs in `frontend/config.js`; the service-role key belongs only in `backend/.env`. Supabase SQL migrations belong in `supabase/migrations/` and are applied in filename order.

