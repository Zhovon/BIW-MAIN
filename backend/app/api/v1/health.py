from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.project_name,
        "environment": settings.environment,
    }


@router.api_route("/ping", methods=["GET", "HEAD"])
def ping() -> dict[str, str]:
    """Lightweight keep-alive endpoint for UptimeRobot (supports GET and HEAD)."""
    return {"status": "pong"}
