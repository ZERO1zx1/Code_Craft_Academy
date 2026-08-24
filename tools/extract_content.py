"""Extracts the hardcoded course content from frontend/assets/js/app.js into
frontend/content/courses.json, the offline fallback and admin-import template.

Run from the repo root:
    python tools/extract_content.py
"""
import json
import re
from pathlib import Path

APP_JS = Path("frontend/assets/js/app.js")
OUT = Path("frontend/content/courses.json")

EXAMPLES = {
    "python": "topic = 'practice'\nminutes = 20\nprint(f'{topic}: {minutes} minutes')",
    "html": "<section aria-labelledby=\"title\">\n  <h2 id=\"title\">Өнөөдрийн хичээл</h2>\n  <p>Утгатай бүтэц.</p>\n</section>",
    "css": ".lesson-card {\n  display: grid;\n  gap: 1rem;\n  padding: clamp(1rem, 3vw, 2rem);\n}",
    "javascript": "const lesson = { completed: false };\nlesson.completed = true;\nconsole.log(lesson);",
}

TAGS = {
    "python": ["python", "програмчлал"],
    "html": ["html", "вэб", "semantic"],
    "css": ["css", "style", "layout"],
    "javascript": ["javascript", "dom", "api"],
}

LESSON_RE = re.compile(r'lesson\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\)')
MODULE_RE = re.compile(r'module\("([^"]+)",\s*"([^"]+)",\s*\[(.*?)\]\)', re.S)
COURSE_HEAD_RE = re.compile(r'"([^"]+)",\s*label:\s*"([^"]+)",\s*icon:\s*"([^"]+)"')


def split_courses(source: str) -> list[str]:
    parts = re.split(r"\n\s*\{\n\s+id:", source)
    return [p for p in parts if COURSE_HEAD_RE.search(p)]


def parse_course(block: str) -> dict | None:
    head = COURSE_HEAD_RE.search(block)
    if not head:
        return None
    slug, label, icon = head.group(1), head.group(2), head.group(3)

    def grab(pattern: str) -> str:
        m = re.search(pattern, block)
        return (m.group(1).replace('\\n', "\n") if m else "")

    modules = []
    for m in MODULE_RE.finditer(block):
        title, summary = m.group(1), m.group(2)
        lessons = []
        for li, lesson in enumerate(LESSON_RE.finditer(m.group(3))):
            lid, ltitle, outcome, task = lesson.groups()
            lessons.append(
                {
                    "slug": lid,
                    "position": li,
                    "title": ltitle,
                    "outcome": outcome,
                    "task": task,
                    "minutes": 20,
                    "explanation": outcome,
                    "example": EXAMPLES.get(slug, ""),
                    "exercise": task,
                    "project": "",
                    "pdf_url": "",
                    "status": "published",
                    "tags": [],
                    "keywords": [],
                    "quiz": [],
                }
            )
        modules.append(
            {
                "position": len(modules),
                "title": title,
                "summary": summary,
                "lessons": lessons,
            }
        )
    color = grab(r'color:\s*"([^"]+)"')
    return {
        "slug": slug,
        "label": label,
        "icon": icon,
        "color": color,
        "eyebrow": grab(r'eyebrow:\s*"([^"]+)"'),
        "duration": grab(r'duration:\s*"([^"]+)"'),
        "level": grab(r'level:\s*"([^"]+)"'),
        "description": grab(r'description:\s*"([^"]+)"'),
        "starter": grab(r'starter:\s*"([^"]+)"'),
        "status": "published",
        "sort_order": 0,
        "modules": modules,
    }


def main() -> None:
    source = APP_JS.read_text(encoding="utf-8")
    courses = []
    for block in split_courses(source):
        course = parse_course(block)
        if course:
            course["sort_order"] = len(courses) + 1
            course["tags"] = TAGS.get(course["slug"], [])
            courses.append(course)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(courses, ensure_ascii=False, indent=2), encoding="utf-8")
    lessons = sum(len(m["lessons"]) for c in courses for m in c["modules"])
    print(f"Wrote {len(courses)} courses, {lessons} lessons -> {OUT}")


if __name__ == "__main__":
    main()