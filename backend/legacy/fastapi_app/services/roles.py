"""Role and ownership helpers shared by admin routes.

Authorization is enforced twice:
  1. In Python here (against the acting user's profile via their token).
  2. In the database by Row Level Security (which also guards direct API access).
"""
from fastapi import HTTPException, status

from ..core.supabase_client import SupabaseNotConfigured, get_supabase

STAFF_ROLES = {"admin", "owner", "teacher"}
VIEWER_ROLES = STAFF_ROLES | {"reviewer"}


def get_profile(user: dict) -> dict:
    client = get_supabase(user.get("access_token"))
    response = client.table("profiles").select("*").eq("id", user["id"]).maybe_single().execute()
    return response.data or {}


def role_of(user: dict) -> str:
    profile = get_profile(user)
    return profile.get("role", "user")


def require_role(user: dict, allowed: set[str]) -> str:
    role = role_of(user)
    if role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return role


def require_staff(user: dict) -> str:
    try:
        return require_role(user, STAFF_ROLES)
    except HTTPException:
        raise
    except SupabaseNotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


def require_admin(user: dict) -> str:
    try:
        return require_role(user, {"admin", "owner"})
    except HTTPException:
        raise
    except SupabaseNotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


def can_manage_course(user: dict, course_id: str) -> bool:
    role = role_of(user)
    if role in {"admin", "owner"}:
        return True
    if role == "teacher":
        client = get_supabase(user.get("access_token"))
        response = (
            client.table("course_instructors")
            .select("role")
            .eq("course_id", course_id)
            .eq("user_id", user["id"])
            .maybe_single()
            .execute()
        )
        return bool(response.data and response.data.get("role") in {"owner", "teacher"})
    return False


def can_view_course(user: dict, course_id: str) -> bool:
    if not user:
        return False
    role = role_of(user)
    if role in VIEWER_ROLES:
        return True
    return can_manage_course(user, course_id)