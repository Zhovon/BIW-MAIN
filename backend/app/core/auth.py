"""JWT authentication using the Supabase SDK — no raw JWT secret needed."""
from __future__ import annotations

from functools import lru_cache

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

from app.core.config import settings

_bearer = HTTPBearer(auto_error=True)


@lru_cache(maxsize=1)
def _supabase() -> Client:
    """Cached Supabase admin client (service role key)."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set as environment variables."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> dict:
    """
    Verify the Supabase JWT by calling auth.get_user() server-side.
    Returns a dict with at minimum {"sub": user_id, "email": user_email}.
    Raises HTTP 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    try:
        client = _supabase()
        response = client.auth.get_user(token)
        user = response.user
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"sub": str(user.id), "email": user.email}
    except HTTPException:
        raise  # re-raise our own exceptions untouched
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
