# CodeCraft Academy

> **Монгол хэл дээрх Python, HTML, CSS, JavaScript сургалтын платформ.** Энэхүү repository нь framework-free frontend, Python/FastAPI backend, болон Supabase database migration-оос бүрдэнэ.

## Stack

| Layer | Technology | Main location |
|---|---|---|
| Frontend markup | HTML5 | `frontend/index.html` |
| Frontend styling | CSS | `frontend/assets/css/styles.css` |
| Frontend behavior | Vanilla JavaScript | `frontend/assets/js/app.js` |
| Backend language | Python | `backend/app/` |
| API framework | FastAPI | `backend/app/main.py` |
| Authentication and database | Supabase | `supabase/migrations/` |

## Folder structure

```text
codecraft-academy/
├── frontend/
│   ├── index.html
│   ├── config.js
│   ├── assets/
│   │   ├── css/styles.css
│   │   └── js/app.js
│   └── README.md
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── supabase_client.py
│   │   └── models/schemas.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── supabase/
│   └── migrations/001_codecraft_core.sql
├── .gitignore
└── STACK_MIGRATION.md
```

## Local setup

### 1. FastAPI backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

In another terminal:

```bash
cd frontend
python3 -m http.server 5500
```

Open `http://localhost:5500`. FastAPI documentation is available at `http://localhost:8000/docs`.

## Supabase setup

Run `supabase/migrations/001_codecraft_core.sql` in the Supabase SQL Editor. Put the public Supabase URL and publishable/anon key in the ignored local file `frontend/config.local.js`. Put the same public values in `backend/.env` as `SUPABASE_URL` and `SUPABASE_ANON_KEY`. A service-role key, if required for server administration, belongs only in `backend/.env` and must never be placed in the frontend.

The API provides the following routes:

| Route | Purpose |
|---|---|
| `GET /api/health` | Service health check |
| `GET /api/courses` | Course catalog |
| `GET /api/profile` | Authenticated profile |
| `GET /api/progress` | Authenticated course progress |
| `POST /api/progress` | Save authenticated course progress |
| `POST /api/quiz/attempts` | Save authenticated quiz attempt |

## Security

Local `.env` files, `frontend/config.local.js`, Python virtual environments, bytecode, logs, and build artifacts are ignored by Git. Never commit Supabase service-role keys, SMTP passwords, private VAPID keys, or other credentials.
