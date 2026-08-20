from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


CourseId = Literal["python", "html", "css", "javascript"]


class Course(BaseModel):
    id: CourseId
    label: str
    description: str
    lessons: str


class ProgressRow(BaseModel):
    user_id: str
    course_id: CourseId
    progress_percent: int = Field(ge=0, le=100)
    updated_at: datetime | None = None


class ProgressUpsert(BaseModel):
    course_id: CourseId
    progress_percent: int = Field(ge=0, le=100)


class Profile(BaseModel):
    id: str
    email: str | None = None
    display_name: str | None = None
    role: str = "user"


class QuizAttemptCreate(BaseModel):
    course_id: CourseId
    lesson_id: str = Field(min_length=1, max_length=96)
    score: int = Field(ge=0)
    total_questions: int = Field(gt=0)
    answers: list[int | str | bool] = Field(default_factory=list)


class QuizAttempt(BaseModel):
    id: str
    user_id: str
    course_id: CourseId
    lesson_id: str
    score: int
    total_questions: int
    submitted_at: datetime | None = None

