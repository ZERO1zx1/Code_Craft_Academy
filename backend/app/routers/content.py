from fastapi import APIRouter, Depends, HTTPException

from ..core.supabase_client import get_optional_user
from ..services import content_service

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("/courses")
def list_courses(user: dict | None = Depends(get_optional_user)):
    try:
        return content_service.get_courses(user)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/courses/{slug}")
def course_detail(slug: str, user: dict | None = Depends(get_optional_user)):
    try:
        course = content_service.get_course(slug, user)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.get("/lessons/{course_slug}/{lesson_slug}")
def lesson_detail(course_slug: str, lesson_slug: str, user: dict | None = Depends(get_optional_user)):
    try:
        lesson = content_service.get_lesson(course_slug, lesson_slug, user)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson