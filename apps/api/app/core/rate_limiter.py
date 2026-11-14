import time
import logging
from typing import Callable
from fastapi import HTTPException, Request, Response
from .config import settings

logger = logging.getLogger("rate_limiter")

def rate_limit(requests_per_minute: int = 60, by: str = "tenant") -> Callable:
    """
    Distributed Sliding Window Rate Limiter powered by Redis ZSET.
    Injects RFC-standard rate-limiting headers:
    - X-RateLimit-Limit
    - X-RateLimit-Remaining
    - X-RateLimit-Reset
    """
    async def dependency(request: Request, response: Response):
        try:
            import redis.asyncio as aioredis
            client = aioredis.from_url(settings["redis_url"], decode_responses=True)

            identifier = request.client.host if request.client else "unknown"
            if by == "tenant":
                auth_tenant = getattr(request.state, "tenant_id", None) or request.headers.get("X-Tenant-Id")
                identifier = auth_tenant or identifier

            now = time.time()
            window_start = now - 60
            redis_key = f"ratelimit:{by}:{identifier}:{request.url.path}"

            pipeline = client.pipeline()
            pipeline.zremrangebyscore(redis_key, 0, window_start)
            pipeline.zadd(redis_key, {str(now): now})
            pipeline.zcard(redis_key)
            pipeline.expire(redis_key, 65)
            _, _, request_count, _ = await pipeline.execute()
            await client.aclose()

            remaining = max(0, requests_per_minute - request_count)
            reset_epoch = int(now + 60)

            # Standard RFC Rate Limiting Headers
            response.headers["X-RateLimit-Limit"] = str(requests_per_minute)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(reset_epoch)

            if request_count > requests_per_minute:
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded: Max {requests_per_minute} requests/minute allowed.",
                    headers={"Retry-After": "60", "X-RateLimit-Remaining": "0"},
                )
        except HTTPException:
            raise
        except Exception as exc:
            logger.debug("Rate limiter check bypassed: %s", exc)

    return dependency
