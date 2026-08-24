"""Admin CRUD, import/export, certificates, and stats.

Writes use the service-role client (bypasses RLS) but every operation first
authorizes the acting user in Python against their own token + profile.
"""
import csv
import io
import json
import uuid as uuidlib

from fastapi import HTTPException, status

from ..core.supabase_client import SupabaseNotConfigured, get_admin_client
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
from .roles import can_manage_course, require_admin, require_staff, role_of


def _admin() -> object:
    try:
        return get_admin_client()
    except SupabaseNotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------
def list_all_courses(user: dict, include_archived: bool = False) -> list[dict]:
    require_staff(user)
    client = _admin()
    query = client.table("courses").select("*").order("sort_order")
    if not include_archived:
        query = query.neq("status", "archived")
    response = query.execute()
    return response.data or []


def create_course(user: dict, payload: AdminCourseCreate) -> dict:
    require_staff(user)
    client = _admin()
    existing = client.table("courses").select("id").eq("slug", payload.slug).maybe_single().execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Course slug already exists")
    data = payload.model_dump()
    response = client.table("courses").insert(data).execute()
    course = response.data[0]
    role = "owner" if role_of(user) in {"admin", "owner"} else "teacher"
    client.table("course_instructors").upsert(
        {"course_id": course["id"], "user_id": user["id"], "role": role},
        on_conflict="course_id,user_id",
    ).execute()
    return course


def update_course(user: dict, course_id: str, payload: AdminCourseUpdate) -> dict:
    if not can_manage_course(user, course_id):
        raise HTTPException(status_code=403, detail="You do not manage this course")
    client = _admin()
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=422, detail="No fields to update")
    response = client.table("courses").update(data).eq("id", course_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Course not found")
    return response.data[0]


def delete_course(user: dict, course_id: str) -> None:
    if not can_manage_course(user, course_id):
        raise HTTPException(status_code=403, detail="You do not manage this course")
    client = _admin()
    client.table("courses").delete().eq("id", course_id).execute()


def set_instructor(user: dict, course_id: str, target_user_id: str, role: str) -> dict:
    require_admin(user)
    client = _admin()
    response = client.table("course_instructors").upsert(
        {"course_id": course_id, "user_id": target_user_id, "role": role},
        on_conflict="course_id,user_id",
    ).execute()
    return response.data[0]


# ---------------------------------------------------------------------------
# Modules
# ---------------------------------------------------------------------------
def create_module(user: dict, payload: AdminModuleInput) -> dict:
    if not can_manage_course(user, payload.course_id):
        raise HTTPException(status_code=403, detail="You do not manage this course")
    client = _admin()
    response = client.table("modules").insert(payload.model_dump()).execute()
    return response.data[0]


def update_module(user: dict, module_id: str, payload: AdminModuleUpdate) -> dict:
    client = _admin()
    current = client.table("modules").select("*").eq("id", module_id).maybe_single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Module not found")
    if not can_manage_course(user, current.data["course_id"]):
        raise HTTPException(status_code=403, detail="You do not manage this course")
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    response = client.table("modules").update(data).eq("id", module_id).execute()
    return response.data[0]


def delete_module(user: dict, module_id: str) -> None:
    client = _admin()
    current = client.table("modules").select("*").eq("id", module_id).maybe_single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Module not found")
    if not can_manage_course(user, current.data["course_id"]):
        raise HTTPException(status_code=403, detail="You do not manage this course")
    client.table("modules").delete().eq("id", module_id).execute()


# ---------------------------------------------------------------------------
# Lessons (with tags, keywords, quiz)
# ---------------------------------------------------------------------------
def create_lesson(user: dict, payload: AdminLessonInput) -> dict:
    if not can_manage_course(user, payload.course_id):
        raise HTTPException(status_code=403, detail="You do not manage this course")
    client = _admin()
    existing = (
        client.table("lessons")
        .select("id")
        .eq("course_id", payload.course_id)
        .eq("slug", payload.slug)
        .maybe_single()
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Lesson slug already exists in this course")
    data = payload.model_dump(exclude={"tags", "keywords", "quiz"})
    response = client.table("lessons").insert(data).execute()
    lesson = response.data[0]
    _set_lesson_assets(client, lesson["id"], payload.tags, payload.keywords, payload.quiz)
    return lesson


def update_lesson(user: dict, lesson_id: str, payload: AdminLessonUpdate) -> dict:
    client = _admin()
    current = client.table("lessons").select("*").eq("id", lesson_id).maybe_single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not can_manage_course(user, current.data["course_id"]):
        raise HTTPException(status_code=403, detail="You do not manage this course")
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    assets_tags = data.pop("tags", None)
    assets_keywords = data.pop("keywords", None)
    if data:
        client.table("lessons").update(data).eq("id", lesson_id).execute()
    if assets_tags is not None or assets_keywords is not None:
        _replace_assets(
            client,
            lesson_id,
            tags=assets_tags if assets_tags is not None else None,
            keywords=assets_keywords if assets_keywords is not None else None,
        )
    response = client.table("lessons").select("*").eq("id", lesson_id).execute()
    return response.data[0]


def delete_lesson(user: dict, lesson_id: str) -> None:
    client = _admin()
    current = client.table("lessons").select("*").eq("id", lesson_id).maybe_single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not can_manage_course(user, current.data["course_id"]):
        raise HTTPException(status_code=403, detail="You do not manage this course")
    client.table("lessons").delete().eq("id", lesson_id).execute()


def upsert_quiz(user: dict, lesson_id: str, questions: list[QuizQuestionInput]) -> list[dict]:
    client = _admin()
    current = client.table("lessons").select("course_id").eq("id", lesson_id).maybe_single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not can_manage_course(user, current.data["course_id"]):
        raise HTTPException(status_code=403, detail="You do not manage this course")
    client.table("quiz_questions").delete().eq("lesson_id", lesson_id).execute()
    rows = [
        {"lesson_id": lesson_id, **q.model_dump()}
        for q in questions
    ]
    if rows:
        response = client.table("quiz_questions").insert(rows).execute()
        return response.data or []
    return []


def _set_lesson_assets(client, lesson_id: str, tags, keywords, quiz):
    if tags:
        client.table("lesson_tags").insert([{"lesson_id": lesson_id, "tag": t} for t in tags]).execute()
    if keywords:
        client.table("lesson_keywords").insert([{"lesson_id": lesson_id, "keyword": k} for k in keywords]).execute()
    if quiz:
        client.table("quiz_questions").insert(
            [{"lesson_id": lesson_id, **q.model_dump()} for q in quiz]
        ).execute()


def _replace_assets(client, lesson_id: str, tags=None, keywords=None):
    if tags is not None:
        client.table("lesson_tags").delete().eq("lesson_id", lesson_id).execute()
        if tags:
            client.table("lesson_tags").insert([{"lesson_id": lesson_id, "tag": t} for t in tags]).execute()
    if keywords is not None:
        client.table("lesson_keywords").delete().eq("lesson_id", lesson_id).execute()
        if keywords:
            client.table("lesson_keywords").insert([{"lesson_id": lesson_id, "keyword": k} for k in keywords]).execute()


# ---------------------------------------------------------------------------
# Export / Import
# ---------------------------------------------------------------------------
def export_json(user: dict) -> list[dict]:
    require_staff(user)
    client = _admin()
    courses = client.table("courses").select("*").order("sort_order").execute().data or []
    out = []
    for course in courses:
        modules = client.table("modules").select("*").eq("course_id", course["id"]).order("position").execute().data or []
        mods_out = []
        for module in modules:
            lessons = (
                client.table("lessons").select("*").eq("module_id", module["id"]).order("position").execute().data or []
            )
            lessons_out = []
            for lesson in lessons:
                tags = [t["tag"] for t in client.table("lesson_tags").select("tag").eq("lesson_id", lesson["id"]).execute().data or []]
                keywords = [k["keyword"] for k in client.table("lesson_keywords").select("keyword").eq("lesson_id", lesson["id"]).execute().data or []]
                quiz = [
                    {
                        "position": q["position"],
                        "question": q["question"],
                        "options": q.get("options") or [],
                        "correct_index": q.get("correct_index") or 0,
                        "explanation": q.get("explanation") or "",
                    }
                    for q in client.table("quiz_questions").select("*").eq("lesson_id", lesson["id"]).order("position").execute().data or []
                ]
                lessons_out.append(
                    {
                        "slug": lesson["slug"],
                        "position": lesson["position"],
                        "title": lesson["title"],
                        "outcome": lesson["outcome"],
                        "task": lesson["task"],
                        "minutes": lesson["minutes"],
                        "explanation": lesson["explanation"],
                        "example": lesson["example"],
                        "exercise": lesson["exercise"],
                        "project": lesson["project"],
                        "pdf_url": lesson["pdf_url"],
                        "status": lesson["status"],
                        "tags": tags,
                        "keywords": keywords,
                        "quiz": quiz,
                    }
                )
            mods_out.append(
                {
                    "position": module["position"],
                    "title": module["title"],
                    "summary": module["summary"],
                    "lessons": lessons_out,
                }
            )
        out.append(
            {
                "slug": course["slug"],
                "label": course["label"],
                "icon": course["icon"],
                "color": course["color"],
                "eyebrow": course["eyebrow"],
                "duration": course["duration"],
                "level": course["level"],
                "description": course["description"],
                "starter": course["starter"],
                "status": course["status"],
                "sort_order": course["sort_order"],
                "modules": mods_out,
            }
        )
    return out


def export_csv(user: dict) -> str:
    courses = export_json(user)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "course_slug", "course_label", "module_position", "module_title", "module_summary",
            "lesson_position", "lesson_slug", "lesson_title", "outcome", "task", "minutes",
            "explanation", "example", "exercise", "project", "pdf_url", "status", "tags", "keywords", "quiz",
        ]
    )
    for course in courses:
        for mi, module in enumerate(course.get("modules", [])):
            for li, lesson in enumerate(module.get("lessons", [])):
                writer.writerow(
                    [
                        course["slug"], course["label"], mi, module["title"], module["summary"],
                        li, lesson["slug"], lesson["title"], lesson["outcome"], lesson["task"], lesson["minutes"],
                        lesson["explanation"], lesson["example"], lesson["exercise"], lesson["project"],
                        lesson["pdf_url"], lesson["status"],
                        "|".join(lesson["tags"]), "|".join(lesson["keywords"]),
                        json.dumps(lesson["quiz"], ensure_ascii=False),
                    ]
                )
    return buf.getvalue()


def import_json(user: dict, courses: list[ImportRowCourse], dry_run: bool = True) -> dict:
    require_staff(user)
    errors: list[str] = []
    validated: list[dict] = []
    for course in courses:
        try:
            validated.append(_validate_course(course))
        except HTTPException as exc:
            errors.append(f"{course.slug}: {exc.detail}")
    summary = {"courses": len(validated), "modules": sum(len(c["modules"]) for c in validated), "lessons": sum(len(m.get("lessons", [])) for m in (m for c in validated for m in c["modules"]))}
    if errors:
        return {"dry_run": dry_run, "summary": summary, "errors": errors, "courses": []}
    if dry_run:
        return {"dry_run": True, "summary": summary, "errors": [], "courses": validated}
    client = _admin()
    applied = 0
    for course in validated:
        course_row = client.table("courses").select("*").eq("slug", course["slug"]).maybe_single().execute().data
        if course_row:
            client.table("courses").update({k: v for k, v in course.items() if k not in ("slug", "modules")}).eq("id", course_row["id"]).execute()
            cid = course_row["id"]
        else:
            inserted = client.table("courses").insert({k: v for k, v in course.items() if k != "modules"}).execute().data[0]
            cid = inserted["id"]
        for mi, module in enumerate(course["modules"]):
            module_row = (
                client.table("modules")
                .select("*")
                .eq("course_id", cid)
                .eq("position", mi)
                .maybe_single()
                .execute()
                .data
            )
            if module_row:
                client.table("modules").update({k: v for k, v in module.items() if k != "lessons"}).eq("id", module_row["id"]).execute()
                mid = module_row["id"]
            else:
                mid = client.table("modules").insert({**{k: v for k, v in module.items() if k != "lessons"}, "course_id": cid}).execute().data[0]["id"]
            for lesson in module.get("lessons", []):
                lesson_row = client.table("lessons").select("*").eq("course_id", cid).eq("slug", lesson["slug"]).maybe_single().execute().data
                lesson_data = {k: v for k, v in lesson.items() if k not in ("tags", "keywords", "quiz")}
                if lesson_row:
                    client.table("lessons").update(lesson_data).eq("id", lesson_row["id"]).execute()
                    lid = lesson_row["id"]
                else:
                    lid = client.table("lessons").insert({**lesson_data, "course_id": cid, "module_id": mid}).execute().data[0]["id"]
                _replace_assets(client, lid, tags=lesson.get("tags") or [], keywords=lesson.get("keywords") or [])
                client.table("quiz_questions").delete().eq("lesson_id", lid).execute()
                quiz = lesson.get("quiz") or []
                if quiz:
                    client.table("quiz_questions").insert([{"lesson_id": lid, **q} for q in quiz]).execute()
        applied += 1
    client.table("content_imports").insert(
        {
            "imported_by": user["id"],
            "source": "json",
            "file_name": "import.json",
            "status": "applied",
            "summary": {"courses": applied, "dry_run": dry_run},
        }
    ).execute()
    return {"dry_run": False, "summary": summary, "errors": [], "courses": []}


def _validate_course(course: ImportRowCourse) -> dict:
    if not course.slug:
        raise HTTPException(status_code=422, detail="Course slug is required")
    data = course.model_dump()
    if not data.get("modules"):
        raise HTTPException(status_code=422, detail=f"Course {course.slug} has no modules")
    return data


# ---------------------------------------------------------------------------
# Users, stats, certificates, achievements
# ---------------------------------------------------------------------------
def list_users(user: dict, limit: int = 200) -> list[dict]:
    require_admin(user)
    client = _admin()
    response = client.table("profiles").select("*").order("created_at", desc=True).limit(limit).execute()
    return response.data or []


def admin_stats(user: dict) -> dict:
    require_admin(user)
    client = _admin()

    def count(table: str, **filters) -> int:
        query = client.table(table).select("id")
        for key, value in filters.items():
            query = query.eq(key, value)
        return len(query.execute().data or [])

    return {
        "total_users": count("profiles"),
        "total_courses": count("courses"),
        "total_lessons": count("lessons"),
        "total_quiz_attempts": count("quiz_attempts"),
        "total_certificates": count("certificates"),
        "total_completed_courses": count("course_progress", progress_percent=100),
    }


def issue_certificate(user: dict, payload: CertificateCreate) -> dict:
    require_admin(user)
    client = _admin()
    course = client.table("courses").select("*").eq("id", payload.course_id).maybe_single().execute().data
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    existing = client.table("certificates").select("*").eq("user_id", payload.user_id).eq("course_id", payload.course_id).maybe_single().execute().data
    if existing:
        raise HTTPException(status_code=409, detail="Certificate already issued for this course")
    serial = f"CC-{course['slug'].upper()}-{uuidlib.uuid4().hex[:10].upper()}"
    response = client.table("certificates").insert(
        {"serial": serial, "user_id": payload.user_id, "course_id": payload.course_id, "template": payload.template}
    ).execute()
    return response.data[0]


def list_certificates(user: dict, user_id: str | None = None) -> list[dict]:
    require_staff(user)
    client = _admin()
    query = client.table("certificates").select("*, courses(slug,label), profiles(email,display_name)")
    if user_id:
        query = query.eq("user_id", user_id)
    elif role_of(user) not in {"admin", "owner"}:
        query = query.eq("user_id", user["id"])
    response = query.order("issued_at", desc=True).execute()
    rows = []
    for row in response.data or []:
        rows.append(
            {
                "id": row["id"],
                "serial": row["serial"],
                "course_id": (row.get("courses") or {}).get("slug", ""),
                "course_label": (row.get("courses") or {}).get("label", ""),
                "user_id": row["user_id"],
                "user_name": (row.get("profiles") or {}).get("display_name") or (row.get("profiles") or {}).get("email", ""),
                "template": row["template"],
                "issued_at": row["issued_at"],
            }
        )
    return rows


def list_achievements(user: dict) -> list[dict]:
    client = _admin()
    response = client.table("achievements").select("*").order("created_at").execute()
    return response.data or []


def user_achievements(user: dict, user_id: str | None = None) -> list[dict]:
    client = _admin()
    target = user_id or user["id"]
    response = (
        client.table("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", target)
        .order("earned_at", desc=True)
        .execute()
    )
    return [{"achievement": row.get("achievements"), "earned_at": row.get("earned_at")} for row in (response.data or [])]


def award_achievement(user: dict, target_user_id: str, achievement_id: str) -> dict:
    require_admin(user)
    client = _admin()
    response = client.table("user_achievements").upsert(
        {"user_id": target_user_id, "achievement_id": achievement_id}, on_conflict="user_id,achievement_id"
    ).execute()
    return response.data[0]


def leaderboard(user: dict, limit: int = 20) -> list[dict]:
    client = _admin()
    response = (
        client.table("course_progress")
        .select("user_id, progress_percent, profiles(email,display_name)")
        .eq("progress_percent", 100)
        .execute()
    )
    rows = response.data or []
    counter: dict[str, dict] = {}
    for row in rows:
        uid = row["user_id"]
        if uid not in counter:
            counter[uid] = {"user_id": uid, "name": (row.get("profiles") or {}).get("display_name") or (row.get("profiles") or {}).get("email", "Суралцагч"), "completed": 0}
        counter[uid]["completed"] += 1
    ranked = sorted(counter.values(), key=lambda r: r["completed"], reverse=True)[:limit]
    for i, r in enumerate(ranked, start=1):
        r["rank"] = i
    return ranked