from fastapi import Header, HTTPException, status
from supabase import Client, create_client

from .config import get_settings


class SupabaseNotConfigured(RuntimeError):
    """Raised when server-side Supabase credentials are not configured."""


def get_supabase(access_token: str | None = None) -> Client:
    settings = get_settings()
    api_key = settings.supabase_service_role_key or settings.supabase_anon_key
    if not settings.supabase_url or not api_key:
        raise SupabaseNotConfigured("SUPABASE_URL and SUPABASE_ANON_KEY are required")
    client = create_client(settings.supabase_url, api_key)
    if access_token:
        client.postgrest.auth(access_token)
    return client


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")

    try:
        user_response = get_supabase().auth.get_user(token)
    except SupabaseNotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase session") from exc

    user = getattr(user_response, "user", None)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase session")
    return {"id": str(user.id), "email": user.email, "metadata": user.user_metadata or {}, "access_token": token}

