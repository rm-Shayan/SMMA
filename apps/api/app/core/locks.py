import time
import uuid
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from .config import settings

logger = logging.getLogger("redis_lock")

# Safe atomic unlock script: only releases if lock value matches worker token
RELEASE_LUA_SCRIPT = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""

@asynccontextmanager
async def distributed_lock(lock_name: str, lease_sec: int = 15) -> AsyncGenerator[bool, None]:
    """
    Cons-Free Distributed Mutex Lock (Redlock Pattern).
    - Prevents duplicate crons across multiple container instances.
    - Eliminates deadlocks via auto-expiring TTL lease.
    - Prevents accidental release by other workers via UUID token verification.
    """
    token = str(uuid.uuid4())
    lock_key = f"lock:{lock_name}"
    acquired = False

    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(settings["redis_url"], decode_responses=True)

        # SET key value NX EX lease_sec is atomic in Redis
        res = await client.set(lock_key, token, nx=True, ex=lease_sec)
        acquired = bool(res)
        yield acquired
    except Exception as exc:
        logger.debug("Redis lock error (proceeding safely): %s", exc)
        yield False
    finally:
        if acquired:
            try:
                await client.eval(RELEASE_LUA_SCRIPT, 1, lock_key, token)
                await client.aclose()
            except Exception:
                pass

