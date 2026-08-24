from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse

from ..core.supabase_client import get_current_user
from ..models.schemas import (
    AdminCourseCreate,
    AdminCourseUpdate,
    AdminLessonInput,
    AdminLessonUpdate,
    AdminModuleInput,
    AdminModuleUpdate,
    CertificateCreate,
    ImportRowCourse,
    QuizQuestionInput,
)
from ..services import admin_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/courses")
def courses_list(user: dict = Depends(get_current_user), include_archived: bool = False):
    return admin_service.list_all_courses(user, include_archived=include_archived)


@router.post("/courses", status_code=201)
def course_create(payload: AdminCourseCreate, user: dict = Depends(get_current_user)):
    return admin_service.create_course(user, payload)


@router.patch("/courses/{course_id}")
def course_update(course_id: str, payload: AdminCourseUpdate, user: dict = Depends(get_current_user)):
    return admin_service.update_course(user, course_id, payload)


@router.delete("/courses/{course_id}", status_code=204)
def course_delete(course_id: str, user: dict = Depends(get_current_user)):
    admin_service.delete_course(user, course_id)


@router.post("/courses/{course_id}/instructors")
def course_add_instructor(course_id: str, target_user_id: str, role: str, user: dict = Depends(get_current_user)):
    return admin_service.set_instructor(user, course_id, target_user_id, role)


@router.post("/courses/{course_id}/modules", status_code=201)
def module_create(course_id: str, payload: AdminModuleInput, user: dict = Depends(get_current_user)):
    return admin_service.create_module(user, payload)


@router.patch("/modules/{module_id}")
def module_update(module_id: str, payload: AdminModuleUpdate, user: dict = Depends(get_current_user)):
    return admin_service.update_module(user, module_id, payload)


@router.delete("/modules/{module_id}", status_code=204)
def module_delete(module_id: str, user: dict = Depends(get_current_user)):
    admin_service.delete_module(user, module_id)


@router.post("/lessons", status_code=201)
def lesson_create(payload: AdminLessonInput, user: dict = Depends(get_current_user)):
    return admin_service.create_lesson(user, payload)


@router.patch("/lessons/{lesson_id}")
def lesson_update(lesson_id: str, payload: AdminLessonUpdate, user: dict = Depends(get_current_user)):
    return admin_service.update_lesson(user, lesson_id, payload)


@router.delete("/lessons/{lesson_id}", status_code=204)
def lesson_delete(lesson_id: str, user: dict = Depends(get_current_user)):
    admin_service.delete_lesson(user, lesson_id)


@router.put("/lessons/{lesson_id}/quiz")
def quiz_upsert(lesson_id: str, questions: list[QuizQuestionInput], user: dict = Depends(get_current_user)):
    return admin_service.upsert_quiz(user, lesson_id, questions)


@router.get("/export/json")
def export_json(user: dict = Depends(get_current_user)):
    return admin_service.export_json(user)


@router.get("/export/csv", response_class=PlainTextResponse)
def export_csv(user: dict = Depends(get_current_user)):
    return admin_service.export_csv(user)


@router.post("/import")
def import_content(
    payload: dict, user: dict = Depends(get_current_user)
):
    dry_run = bool(payload.get("dry_run", True))
    raw_courses = payload.get("courses") or []
    courses = [ImportRowCourse(**c) for c in raw_courses]
    return admin_service.import_json(user, courses, dry_run=dry_run)


@router.get("/stats")
def stats(user: dict = Depends(get_current_user)):
    return admin_service.admin_stats(user)


@router.get("/users")
def users_list(user: dict = Depends(get_current_user)):
    return admin_service.list_users(user)


@router.get("/certificates")
def certificates_list(user: dict = Depends(get_current_user), user_id: str | None = None):
    return admin_service.list_certificates(user, user_id=user_id)


@router.post("/certificates", status_code=201)
def certificate_issue(payload: CertificateCreate, user: dict = Depends(get_current_user)):
    return admin_service.issue_certificate(user, payload)


@router.get("/achievements")
def achievements_list(user: dict = Depends(get_current_user)):
    return admin_service.list_achievements(user)


@router.get("/users/{user_id}/achievements")
def user_achievements(user_id: str, user: dict = Depends(get_current_user)):
    return admin_service.user_achievements(user, user_id=user_id)


@router.post("/achievements/award")
def achievement_award(target_user_id: str, achievement_id: str, user: dict = Depends(get_current_user)):
    return admin_service.award_achievement(user, target_user_id, achievement_id)


@router.get("/leaderboard")
def leaderboard(user: dict = Depends(get_current_user)):
    return admin_service.leaderboard(user)