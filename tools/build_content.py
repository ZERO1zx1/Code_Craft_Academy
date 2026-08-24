"""Build the per-course / per-lesson content folder structure for the frontend.

Reads the extracted catalog from courses.json, merges the curated
tags/keywords/explanations/exercises/projects from content_data.py, then writes:

  frontend/content/courses.json                     -> course index (summaries)
  frontend/content/<course>/course.json             -> full course + module/lesson index
  frontend/content/<course>/lessons/<lesson>.json   -> full lesson file (one per lesson)
"""

import json
import sys
from pathlib import Path

from content_data import CONTENT

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "frontend" / "content"
CATALOG = CONTENT_DIR / "courses.json"


def main() -> None:
    with open(CATALOG, "r", encoding="utf-8") as fh:
        catalog = json.load(fh)

    index = []
    written_lessons = 0
    for course in catalog:
        slug = course["slug"]
        lessons_dir = CONTENT_DIR / slug / "lessons"
        lessons_dir.mkdir(parents=True, exist_ok=True)

        course_content = CONTENT.get(slug, {})
        modules = []
        for module in course.get("modules", []):
            lesson_refs = []
            for lesson in module.get("lessons", []):
                lslug = lesson["slug"]
                meta = course_content.get(lslug, {})
                full = {
                    "slug": lslug,
                    "title": lesson.get("title", ""),
                    "position": lesson.get("position", 0),
                    "minutes": lesson.get("minutes", 20),
                    "module": {
                        "position": module.get("position", 0),
                        "title": module.get("title", ""),
                        "summary": module.get("summary", ""),
                    },
                    "outcome": lesson.get("outcome", ""),
                    "task": lesson.get("task", ""),
                    "explanation": meta.get("explanation") or lesson.get("outcome", ""),
                    "example": lesson.get("example", ""),
                    "exercise": meta.get("exercise") or lesson.get("task", ""),
                    "project": meta.get("project", ""),
                    "pdf_url": lesson.get("pdf_url", ""),
                    "status": lesson.get("status", "published"),
                    "tags": meta.get("tags", []),
                    "keywords": meta.get("keywords", []),
                    "quiz": lesson.get("quiz", []),
                }
                with open(lessons_dir / f"{lslug}.json", "w", encoding="utf-8") as fh:
                    json.dump(full, fh, ensure_ascii=False, indent=2)
                written_lessons += 1
                lesson_refs.append({
                    "slug": lslug,
                    "position": lesson.get("position", 0),
                    "title": lesson.get("title", ""),
                    "outcome": lesson.get("outcome", ""),
                    "task": lesson.get("task", ""),
                    "minutes": lesson.get("minutes", 20),
                    "pdf_url": lesson.get("pdf_url", ""),
                    "tags": meta.get("tags", []),
                    "keywords": meta.get("keywords", []),
                })
            modules.append({
                "position": module.get("position", 0),
                "title": module.get("title", ""),
                "summary": module.get("summary", ""),
                "lessons": lesson_refs,
            })

        course_full = {
            "slug": course.get("slug", ""),
            "label": course.get("label", ""),
            "icon": course.get("icon", ""),
            "color": course.get("color", ""),
            "eyebrow": course.get("eyebrow", ""),
            "duration": course.get("duration", ""),
            "level": course.get("level", ""),
            "description": course.get("description", ""),
            "starter": course.get("starter", ""),
            "status": course.get("status", "published"),
            "sort_order": course.get("sort_order", 0),
            "modules": modules,
        }
        with open(CONTENT_DIR / slug / "course.json", "w", encoding="utf-8") as fh:
            json.dump(course_full, fh, ensure_ascii=False, indent=2)

        index.append({
            "slug": slug,
            "label": course.get("label", ""),
            "icon": course.get("icon", ""),
            "color": course.get("color", ""),
            "eyebrow": course.get("eyebrow", ""),
            "duration": course.get("duration", ""),
            "level": course.get("level", ""),
            "description": course.get("description", ""),
            "starter": course.get("starter", ""),
            "status": course.get("status", "published"),
            "sort_order": course.get("sort_order", 0),
            "module_count": len(modules),
            "lesson_count": sum(len(m["lessons"]) for m in modules),
        })

    with open(CONTENT_DIR / "courses.json", "w", encoding="utf-8") as fh:
        json.dump(index, fh, ensure_ascii=False, indent=2)

    print(f"OK: {len(index)} courses, {written_lessons} lesson files -> {CONTENT_DIR}")


if __name__ == "__main__":
    sys.exit(main())