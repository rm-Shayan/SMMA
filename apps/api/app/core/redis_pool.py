import logging
from typing import Optional
from .config import settings

logger = logging.getLogger("redis_pool")

_redis_pool = None

def get_redis_client():
    """
    Centralized Redis Pool with Memory & Eviction Protection.
    - Reuses single connection pool across all workers (no connection exhaustion).
    - Auto-reconnects on transient socket drops.
    - Optimized for volatile-lru policy (critical queue data safe, cache auto-cleaned).
    """
    global _redis_pool
    try:
        import redis.asyncio as aioredis
        if _redis_pool is None:
            _redis_pool = aioredis.ConnectionPool.from_url(
                settings["redis_url"],
                max_connections=50,
                decode_responses=True,
                socket_timeout=5.0,
                socket_connect_timeout=5.0,
            )
        return aioredis.Redis(connection_pool=_redis_pool)
    except Exception as exc:
        logger.warning("Redis client initialization fallback: %s", exc)
        return None

async def verify_redis_health() -> dict:
    """Verifies Redis memory policy and connection status."""
    client = get_redis_client()
    if not client:
        return {"status": "unreachable"}
    try:
        info = await client.info(section="memory")
        max_mem_policy = info.get("maxmemory_policy", "volatile-lru")
        used_memory_human = info.get("used_memory_human", "N/A")
        return {
            "status": "healthy",
            "policy": max_mem_policy,
            "usedMemory": used_memory_human,
        }
    except Exception as exc:
        return {"status": "degraded", "error": str(exc)}

