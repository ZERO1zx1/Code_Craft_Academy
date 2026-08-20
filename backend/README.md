# CodeCraft Academy FastAPI backend

This folder contains the Python API for the HTML/CSS/JavaScript frontend. FastAPI exposes the health check, course catalog, Supabase-authenticated profile, progress, and quiz-attempt endpoints.

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

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`. The service-role key is server-only and must never be copied into `frontend/config.js` or committed to Git.

The interactive API documentation is available at `http://localhost:8000/docs`.

