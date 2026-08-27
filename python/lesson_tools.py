"""CodeCraft Academy-ийн Python lesson-д ашиглах энгийн өгөгдөл боловсруулах жишээ."""

COURSES = ("HTML", "CSS", "JavaScript", "Python", "GitHub")


def lesson_label(course: str, lesson_number: int, term: str) -> str:
    """Хичээлийн товч шошгыг үүсгэнэ."""
    return f"{course} · {lesson_number:02d} · {term}"


def course_summary(course: str, lessons: list[str]) -> dict[str, object]:
    """Нэг сургалтын замын хичээлийн тоо ба эхний ойлголтыг буцаана."""
    return {"course": course, "lesson_count": len(lessons), "first_lesson": lessons[0] if lessons else None}


if __name__ == "__main__":
    print(lesson_label("Python", 1, "print"))
