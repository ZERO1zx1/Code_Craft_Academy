# CodeCraft Academy FastAPI backend

This folder contains the Python API for the HTML/CSS/JavaScript frontend. FastAPI exposes the health check, public browser configuration, course catalog, Supabase-authenticated profile, course/lesson progress, preferences, and quiz-attempt endpoints.

```text
backend/
├── app/
│   ├── main.py                 # FastAPI app and endpoint registration
│   ├── core/
│   │   ├── config.py           # Environment-backed settings
│   │   └── supabase_client.py  # Auth and server-side Supabase client
│   └── models/
│       └── schemas.py           # Pydantic request/response models
├── requirements.txt
└── .env.example
```

## Run locally

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Set `SUPABASE_URL` and either `SUPABASE_ANON_KEY` or `SUPABASE_KEY` in `.env`. A `SUPABASE_SERVICE_ROLE_KEY` is optional and server-only; it must never be copied into frontend code or committed to Git. The API exposes the publishable key through `/api/public-config`, then the frontend uses it for Supabase Auth and Realtime.

## AI mentor key

Copy the `AI_*` lines from `.env.example` into the ignored `backend/.env`, then replace only `AI_API_KEY` with your provider key. The API never returns the key: `GET /api/ai/status` returns only the provider, model, and whether a key is configured. An actual AI tutor endpoint is intentionally not enabled until its prompts, quotas, and cost controls are chosen.

The interactive API documentation is available at `http://localhost:8000/docs`.

