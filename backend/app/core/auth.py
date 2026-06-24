"""JWT authentication using the Supabase SDK — no raw JWT secret needed."""
from __future__ import annotations

from functools import lru_cache

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

from app.core.config import settings
_bearer = HTTPBearer(auto_error=False)

@lru_cache(maxsize=1)
def _supabase() -> Client:
    """Cached Supabase admin client (service role key)."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set as environment variables."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


import time
from typing import Dict, Tuple

_token_cache: Dict[str, Tuple[dict, float]] = {}
CACHE_TTL = 300  # 5 minutes

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> dict:
    """
    Verify the Supabase JWT by calling auth.get_user() server-side.
    Returns a dict with at minimum {"sub": user_id, "email": user_email}.
    Raises HTTP 401 if the token is missing, expired, or invalid.
    Uses in-memory caching to avoid rate-limiting from Supabase.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    
    # Check cache
    now = time.time()
    if token in _token_cache:
        cached_user, expires_at = _token_cache[token]
        if now < expires_at:
            return cached_user
        else:
            del _token_cache[token]

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
        
        user_dict = {"sub": str(user.id), "email": user.email}
        _token_cache[token] = (user_dict, now + CACHE_TTL)
        return user_dict
        
    except HTTPException:
        raise  # re-raise our own exceptions untouched
    except Exception as e:
        print(f"Supabase auth validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
