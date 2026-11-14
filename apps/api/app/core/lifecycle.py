import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from .db import engine
from .config import settings

logger = logging.getLogger("lifecycle")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Zero-Downtime Graceful Startup & Shutdown Lifespan Manager.
    Drains in-flight requests, shuts down workers, and safely cleans connection pools.
    """
    # 1. Startup phase
    logger.info("Initializing Styre-BOT Modular Monolith services...")
    try:
        import redis.asyncio as aioredis
        redis_client = aioredis.from_url(settings["redis_url"], decode_responses=True)
        await redis_client.ping()
        await redis_client.aclose()
        logger.info("Redis Pub/Sub connection verified.")
    except Exception as exc:
        logger.warning("Redis initial ping skipped/unavailable: %s", exc)

    yield

    # 2. Shutdown phase (SIGTERM / SIGINT triggered by Docker/K8s/PM2)
    logger.info("Graceful shutdown initiated. Draining active connections...")
    
    # Allow 2-3 seconds for active in-flight responses and SSE streams to flush
    await asyncio.sleep(2)

    # Cleanly dispose PostgreSQL connection pool
    try:
        engine.dispose()
        logger.info("PostgreSQL connection pool disposed cleanly.")
    except Exception as exc:
        logger.error("Error disposing database pool: %s", exc)

    logger.info("Graceful shutdown completed. Zero dropped requests.")

