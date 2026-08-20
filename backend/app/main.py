from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .core.supabase_client import SupabaseNotConfigured, get_current_user, get_supabase
from .models.schemas import Course, Profile, ProgressRow, ProgressUpsert, QuizAttempt, QuizAttemptCreate

settings = get_settings()

app = FastAPI(title=settings.app_name, version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:5500", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

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


@app.get("/api/profile", response_model=Profile)
def get_profile(user: dict = Depends(get_current_user)) -> Profile:
    try:
        response = configured_client(user.get("access_token")).table("profiles").select("id,email,display_name,role").eq("id", user["id"]).maybe_single().execute()
        profile = response.data or {}
    except Exception:
        profile = {}
    return Profile(id=user["id"], email=profile.get("email") or user.get("email"), display_name=profile.get("display_name") or user.get("metadata", {}).get("display_name"), role=profile.get("role", "user"))


@app.post("/api/quiz/attempts", response_model=QuizAttempt)
def save_quiz_attempt(payload: QuizAttemptCreate, user: dict = Depends(get_current_user)) -> QuizAttempt:
    if payload.score > payload.total_questions:
        raise HTTPException(status_code=422, detail="Score cannot exceed total questions")
    response = configured_client(user.get("access_token")).table("quiz_attempts").insert({"user_id": user["id"], "course_id": payload.course_id, "lesson_id": payload.lesson_id, "score": payload.score, "total_questions": payload.total_questions, "answers": payload.answers}).execute()
    if not response.data:
        raise HTTPException(status_code=502, detail="Supabase did not return the saved quiz attempt")
    return QuizAttempt(**response.data[0])

