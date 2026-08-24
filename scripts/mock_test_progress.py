"""Mock test for the RLS-scoped progress API endpoints."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def check(condition: bool, label: str) -> None:
    if not condition:
        raise RuntimeError(label)
    print(f"PASS: {label}")


def main() -> int:
    from app import create_app
    from backend.db import db

    app = create_app()
    app.config["TESTING"] = True

    # Mock db methods to bypass Supabase calls.
    mock_user_id = "00000000-0000-0000-0000-000000000000"
    mock_credential = "local-test-credential"

    def mock_get_auth_user(token):
        return {"id": mock_user_id, "email": "test@example.com"}

    def mock_ensure_profile(auth_user, token):
        return {
            "id": mock_user_id,
            "email": "test@example.com",
            "name": "Test User",
            "role": "student",
            "locale": "mn",
            "theme": "system",
        }

    def mock_get_lesson_progress(user_id, token):
        return []

    def mock_complete_lesson(user_id, token, course_id, lesson_id):
        return None

    def mock_save_course_progress(user_id, token, course_id, percent):
        return None

    def mock_remove_lesson_completion(user_id, token, course_id, lesson_id):
        return None

    db.get_auth_user = mock_get_auth_user
    db.ensure_profile = mock_ensure_profile
    db.get_lesson_progress = mock_get_lesson_progress
    db.complete_lesson = mock_complete_lesson
    db.save_course_progress = mock_save_course_progress
    db.remove_lesson_completion = mock_remove_lesson_completion

    with app.test_client() as client:
        headers = {"Authorization": f"Bearer {mock_credential}"}

        response = client.get("/api/progress", headers=headers)
        check(response.status_code == 200, "Mock GET /api/progress status")
        check(response.json["completed_lessons"] == 0, "Mock GET /api/progress payload")

        response = client.post(
            "/api/progress/lessons",
            headers=headers,
            json={"course_id": "python", "lesson_id": "py-start"},
        )
        check(response.status_code == 200, "Mock POST /api/progress/lessons")

        response = client.delete("/api/progress/lessons/python/py-start", headers=headers)
        check(response.status_code == 200, "Mock DELETE /api/progress/lessons")

    print("MOCK_PROGRESS_API_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
