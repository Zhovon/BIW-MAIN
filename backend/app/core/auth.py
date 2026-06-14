"""JWT authentication dependency for all protected API endpoints."""
from __future__ import annotations

import os

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer(auto_error=True)

# Loaded from environment — set SUPABASE_JWT_SECRET in Vercel / .env
SUPABASE_JWT_SECRET: str = os.environ.get("SUPABASE_JWT_SECRET", "")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> dict:
    """
    Verify the Supabase-issued JWT bearer token.
    Returns the decoded payload (contains sub, email, role, aud, exp …).
    Raises HTTP 401/503 on failure — never lets an unauthenticated call through.
    """
    if not SUPABASE_JWT_SECRET:
        # Fail secure: if the secret is missing the server is misconfigured.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured on the server.",
        )

    token = credentials.credentials
    try:
        payload: dict = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
