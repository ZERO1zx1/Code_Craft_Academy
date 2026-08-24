"""Reads course content from Supabase with RLS applying the acting user's token."""
from ..core.supabase_client import SupabaseNotConfigured, get_supabase
from .roles import can_manage_course, can_view_course


def _client(user: dict | None = None):
    return get_supabase(user.get("access_token") if user else None)


def get_courses(user: dict | None = None) -> list[dict]:
    client = _client(user)
    response = client.table("courses").select("*, modules(id), lessons(id)").order("sort_order").execute()
    courses = response.data or []
    result = []
    for row in courses:
        visible = row.get("status") == "published" or (user and can_view_course(user, row["id"]))
        if not visible:
            continue
        result.append(
            {
                "id": row["slug"],
                "label": row["label"],
                "icon": row["icon"],
                "color": row["color"],
                "eyebrow": row["eyebrow"],
                "duration": row["duration"],
                "level": row["level"],
                "description": row["description"],
                "starter": row["starter"],
                "status": row["status"],
                "sort_order": row["sort_order"],
                "module_count": len(row.get("modules", []) or []),
                "lesson_count": len(row.get("lessons", []) or []),
            }
        )
    return result


def get_course(slug: str, user: dict | None = None) -> dict | None:
    client = _client(user)
    response = client.table("courses").select("*").eq("slug", slug).maybe_single().execute()
    course = response.data
    if not course:
        return None
    if course.get("status") != "published" and not (user and can_view_course(user, course["id"])):
        return None

    modules_resp = client.table("modules").select("*").eq("course_id", course["id"]).order("position").execute()
    modules = []
    for module in modules_resp.data or []:
        lessons_resp = (
            client.table("lessons")
            .select("id,slug,position,title,outcome,task,minutes,status")
            .eq("module_id", module["id"])
            .order("position")
            .execute()
        )
        lessons = [
            {**lesson, "id": lesson["slug"]}
            for lesson in lessons_resp.data or []
            if lesson.get("status") == "published" or (user and can_manage_course(user, course["id"]))
        ]
        modules.append(
            {
                "id": module["id"],
                "position": module["position"],
                "title": module["title"],
                "summary": module["summary"],
                "lessons": lessons,
            }
        )
    return {
        "id": course["slug"],
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
        "modules": modules,
    }


def get_lesson(course_slug: str, lesson_slug: str, user: dict | None = None) -> dict | None:
    client = _client(user)
    course_resp = client.table("courses").select("*").eq("slug", course_slug).maybe_single().execute()
    course = course_resp.data
    if not course:
        return None
    if course.get("status") != "published" and not (user and can_view_course(user, course["id"])):
        return None

    lesson_resp = (
        client.table("lessons")
        .select("*")
        .eq("course_id", course["id"])
        .eq("slug", lesson_slug)
        .maybe_single()
        .execute()
    )
    lesson = lesson_resp.data
    if not lesson:
        return None
    if lesson.get("status") != "published" and not (user and can_manage_course(user, course["id"])):
        return None

    tags = client.table("lesson_tags").select("tag").eq("lesson_id", lesson["id"]).execute()
    keywords = client.table("lesson_keywords").select("keyword").eq("lesson_id", lesson["id"]).execute()
    quiz = client.table("quiz_questions").select("*").eq("lesson_id", lesson["id"]).order("position").execute()

    module_resp = client.table("modules").select("*").eq("id", lesson["module_id"]).maybe_single().execute()
    module = module_resp.data or {}

    return {
        "id": lesson["slug"],
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
        "tags": [t["tag"] for t in (tags.data or [])],
        "keywords": [k["keyword"] for k in (keywords.data or [])],
        "quiz": [
            {
                "id": q["id"],
                "position": q["position"],
                "question": q["question"],
                "options": q.get("options") or [],
                "correct_index": q.get("correct_index") or 0,
                "explanation": q.get("explanation") or "",
            }
            for q in (quiz.data or [])
        ],
        "module": {"id": module.get("id"), "title": module.get("title"), "summary": module.get("summary")},
        "course": {"id": course["slug"], "label": course["label"], "color": course["color"], "icon": course["icon"]},
    }


def list_modules(course_id: str, user: dict | None = None) -> list[dict]:
    client = _client(user)
    response = client.table("modules").select("*").eq("course_id", course_id).order("position").execute()
    return response.data or []