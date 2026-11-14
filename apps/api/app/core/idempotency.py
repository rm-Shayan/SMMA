import json
import logging
from typing import Optional
from fastapi import Header, HTTPException, Request
from .config import settings

logger = logging.getLogger("idempotency")

async def check_idempotency(
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
) -> Optional[dict]:
    """
    Prevents duplicate mutations (e.g. credit purchases, agent runs, outbox jobs).
    Uses Redis TTL locking. Returns cached result if already completed.
    """
    if not idempotency_key or request.method not in ("POST", "PATCH", "PUT"):
        return None

    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(settings["redis_url"], decode_responses=True)
        key = f"idempotency:{idempotency_key}"

        existing = await client.get(key)
        if existing:
            await client.aclose()
            data = json.loads(existing)
            if data.get("status") == "processing":
                raise HTTPException(status_code=409, detail="Concurrent request with identical Idempotency-Key in progress")
            return data.get("response")

        # Lock for 60 seconds while request is executing
        await client.set(key, json.dumps({"status": "processing"}), ex=60)
        await client.aclose()
        request.state.idempotency_key = key
    except HTTPException:
        raise
    except Exception as exc:
        logger.debug("Idempotency store bypass: %s", exc)

    return None

async def store_idempotent_result(request: Request, response_data: dict) -> None:
    key = getattr(request.state, "idempotency_key", None)
    if not key:
        return
    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(settings["redis_url"], decode_responses=True)
        await client.set(key, json.dumps({"status": "completed", "response": response_data}), ex=86400)
        await client.aclose()
    except Exception as exc:
        logger.debug("Idempotency cache store failed: %s", exc)

