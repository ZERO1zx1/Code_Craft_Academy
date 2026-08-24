from fastapi import APIRouter, Depends, HTTPException

from ..core.supabase_client import SupabaseNotConfigured, get_current_user
from ..services import admin_service

router = APIRouter(prefix="/api", tags=["certificates"])


@router.get("/certificates")
def my_certificates(user: dict = Depends(get_current_user)):
    try:
        return admin_service.list_certificates(user, user_id=user["id"])
    except SupabaseNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/achievements")
def my_achievements(user: dict = Depends(get_current_user)):
    try:
        return admin_service.user_achievements(user, user_id=user["id"])
    except SupabaseNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc