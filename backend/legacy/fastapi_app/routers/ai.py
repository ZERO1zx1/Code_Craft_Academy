from fastapi import APIRouter, Depends

from ..core.supabase_client import get_current_user
from ..models.schemas import AIChatRequest, AIChatResponse
from ..services import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/chat", response_model=AIChatResponse)
def ai_chat(payload: AIChatRequest, user: dict = Depends(get_current_user)):
    return ai_service.chat(user, payload.course_id, payload.lesson_id, payload.message)