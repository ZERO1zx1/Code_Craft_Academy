from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .core.config import get_settings
from .core.supabase_client import SupabaseNotConfigured, get_current_user, get_supabase
from .models.schemas import (
    Course,
    AIStatus,
    LessonProgressRow,
    LessonProgressUpsert,
    PreferencesUpdate,
    Profile,
    ProgressRow,
    ProgressUpsert,
    PublicConfig,
    QuizAttempt,
    QuizAttemptCreate,
)

settings = get_settings()
FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"

app = FastAPI(title=settings.app_name, version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="frontend-assets")

COURSES = [
    Course(id="python", label="Python", description="Python-оор өгөгдөл, нөхцөл, давталт, функцийн суурийг сурна.", lessons="Python-ийн хичээлүүд"),
    Course(id="html", label="HTML", description="Semantic бүтэц, хүртээмжтэй markup болон бодит page байгуулна.", lessons="HTML-ийн хичээлүүд"),
    Course(id="css", label="CSS", description="Layout, responsive систем, animation, design token ашиглана.", lessons="CSS-ийн хичээлүүд"),
    Course(id="javascript", label="JavaScript", description="DOM, event, async/API, module болон жижиг бүтээгдэхүүн бүтээнэ.", lessons="JavaScript-ийн хичээлүүд"),
]


def configured_client(access_token: str | None = None):
    try:
        return get_supabase(access_token)
    except SupabaseNotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name, "environment": settings.environment}


@app.get("/api/public-config", response_model=PublicConfig)
def public_config() -> PublicConfig:
    if not settings.supabase_url or not settings.public_supabase_key:
        raise HTTPException(status_code=503, detail="Supabase public configuration is unavailable")
    return PublicConfig(supabase_url=settings.supabase_url, supabase_publishable_key=settings.public_supabase_key)


@app.get("/api/ai/status", response_model=AIStatus)
def ai_status() -> AIStatus:
    """Expose readiness only; the API key must never leave the server."""
    return AIStatus(provider=settings.ai_provider, model=settings.ai_model, configured=settings.ai_enabled)


@app.get("/api/courses", response_model=list[Course])
def list_courses() -> list[Course]:
    return COURSES


@app.get("/api/progress", response_model=list[ProgressRow])
def list_progress(user: dict = Depends(get_current_user)) -> list[ProgressRow]:
    response = configured_client(user.get("access_token")).table("course_progress").select("user_id,course_id,progress_percent,updated_at").eq("user_id", user["id"]).order("course_id").execute()
    return [ProgressRow(**row) for row in (response.data or [])]


@app.post("/api/progress", response_model=ProgressRow)
def save_progress(payload: ProgressUpsert, user: dict = Depends(get_current_user)) -> ProgressRow:
    row = {"user_id": user["id"], **payload.model_dump()}
    response = configured_client(user.get("access_token")).table("course_progress").upsert(row, on_conflict="user_id,course_id").execute()
    if not response.data:
        raise HTTPException(status_code=502, detail="Supabase did not return the saved progress")
    return ProgressRow(**response.data[0])


@app.get("/api/lesson-progress", response_model=list[LessonProgressRow])
def list_lesson_progress(user: dict = Depends(get_current_user)) -> list[LessonProgressRow]:
    response = configured_client(user.get("access_token")).table("lesson_progress").select("user_id,course_id,lesson_id,completed_at").eq("user_id", user["id"]).order("completed_at").execute()
    return [LessonProgressRow(**row) for row in (response.data or [])]


@app.post("/api/lesson-progress", response_model=LessonProgressRow | None)
def save_lesson_progress(payload: LessonProgressUpsert, user: dict = Depends(get_current_user)) -> LessonProgressRow | None:
    client = configured_client(user.get("access_token"))
    filters = {"user_id": user["id"], "course_id": payload.course_id, "lesson_id": payload.lesson_id}
    if not payload.completed:
        client.table("lesson_progress").delete().match(filters).execute()
        return None
    response = client.table("lesson_progress").upsert(filters, on_conflict="user_id,course_id,lesson_id").execute()
    if not response.data:
        raise HTTPException(status_code=502, detail="Supabase did not return the saved lesson progress")
    return LessonProgressRow(**response.data[0])


@app.get("/api/profile", response_model=Profile)
def get_profile(user: dict = Depends(get_current_user)) -> Profile:
    try:
        response = configured_client(user.get("access_token")).table("profiles").select("id,email,display_name,role,locale,theme").eq("id", user["id"]).maybe_single().execute()
        profile = response.data or {}
    except Exception:
        profile = {}
    return Profile(id=user["id"], email=profile.get("email") or user.get("email"), display_name=profile.get("display_name") or user.get("metadata", {}).get("display_name"), role=profile.get("role", "user"), locale=profile.get("locale", "mn"), theme=profile.get("theme", "system"))


@app.post("/api/preferences", response_model=Profile)
def save_preferences(payload: PreferencesUpdate, user: dict = Depends(get_current_user)) -> Profile:
    current = get_profile(user)
    row = {
        "id": user["id"],
        "email": current.email,
        "display_name": current.display_name,
        "locale": payload.locale or current.locale,
        "theme": payload.theme or current.theme,
    }
    response = configured_client(user.get("access_token")).table("profiles").upsert(row, on_conflict="id").execute()
    if not response.data:
        raise HTTPException(status_code=502, detail="Supabase did not return the saved preferences")
    saved = response.data[0]
    return Profile(id=user["id"], email=saved.get("email"), display_name=saved.get("display_name"), role=saved.get("role", "user"), locale=saved.get("locale", "mn"), theme=saved.get("theme", "system"))


@app.post("/api/quiz/attempts", response_model=QuizAttempt)
def save_quiz_attempt(payload: QuizAttemptCreate, user: dict = Depends(get_current_user)) -> QuizAttempt:
    if payload.score > payload.total_questions:
        raise HTTPException(status_code=422, detail="Score cannot exceed total questions")
    response = configured_client(user.get("access_token")).table("quiz_attempts").insert({"user_id": user["id"], "course_id": payload.course_id, "lesson_id": payload.lesson_id, "score": payload.score, "total_questions": payload.total_questions, "answers": payload.answers}).execute()
    if not response.data:
        raise HTTPException(status_code=502, detail="Supabase did not return the saved quiz attempt")
    return QuizAttempt(**response.data[0])


@app.get("/", include_in_schema=False)
@app.get("/{client_path:path}", include_in_schema=False)
def frontend_app(client_path: str = ""):
    """Serve the SPA shell so copied course links and browser refreshes work."""
    if not FRONTEND_DIR.is_dir():
        raise HTTPException(status_code=404, detail="Frontend files are unavailable")

    requested_file = (FRONTEND_DIR / client_path).resolve()
    if client_path in {"config.js", "config.local.js"} and requested_file.is_file() and FRONTEND_DIR in requested_file.parents:
        return FileResponse(requested_file)
    return FileResponse(FRONTEND_DIR / "index.html")

