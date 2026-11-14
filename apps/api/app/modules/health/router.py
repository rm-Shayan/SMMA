from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.config import settings

router = APIRouter(prefix="/health", tags=["health"])

@router.get("")
def health_simple():
    """Simple health check endpoint."""
    return {"success": True, "service": "styre-api", "status": "healthy"}

@router.get("/live")
def liveness_probe():
    """
    Kubernetes / Load-Balancer Liveness Probe.
    Verifies the web server process is responsive without querying databases.
    """
    return {"status": "alive", "timestamp": __import__("time").time()}

@router.get("/ready")
def readiness_probe(db: Session = Depends(get_db)):
    """
    Kubernetes / Load-Balancer Readiness Probe.
    Checks PostgreSQL connection pool and Redis reachability before routing user traffic.
    """
    # 1. Check PostgreSQL connection pool
    try:
        db.execute(text("SELECT 1")).scalar()
        db_status = "healthy"
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"PostgreSQL connection pool unavailable: {exc}",
        )

    # 2. Check Redis reachability
    redis_status = "healthy"
    try:
        import redis
        client = redis.from_url(settings["redis_url"])
        client.ping()
        client.close()
    except Exception:
        redis_status = "degraded"

    return {
        "status": "ready",
        "checks": {
            "database": db_status,
            "redis": redis_status,
            "storage": settings.get("storage_driver", "local"),
        },
    }
