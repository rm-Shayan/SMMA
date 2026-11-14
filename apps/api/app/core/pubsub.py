import asyncio
import json
import logging
from typing import Any, Dict, Set

from fastapi import WebSocket

from app.core.config import settings
from app.core.redis_pool import get_redis_client
from app.core.ws_buffer import BufferedConnection

logger = logging.getLogger("pubsub")


class ConnectionManager:
    """Tenant-isolated, topic-based WebSocket fan-out with bounded queues."""

    def __init__(self) -> None:
        self.rooms: Dict[str, Set[BufferedConnection]] = {}
        self.loop: asyncio.AbstractEventLoop | None = None

    async def connect(self, company_id: str, ws: WebSocket, topic: str = "all") -> BufferedConnection:
        await ws.accept()
        conn = BufferedConnection(str(company_id), ws, topic)
        conn.start()
        self.rooms.setdefault(str(company_id), set()).add(conn)
        return conn

    def subscribe(self, conn: BufferedConnection, topic: str) -> None:
        conn.topics.add(topic)

    def unsubscribe(self, conn: BufferedConnection, topic: str) -> None:
        conn.topics.discard(topic)

    async def disconnect(self, company_id: str, conn: BufferedConnection) -> None:
        self.rooms.get(company_id, set()).discard(conn)
        await conn.close()

    async def broadcast(self, company_id: str, message: Dict[str, Any], topic: str = "all") -> None:
        for conn in list(self.rooms.get(company_id, [])):
            if "all" in conn.topics or topic in conn.topics:
                conn.enqueue(message)

    async def close_all(self, code: int = 1001) -> None:
        for conns in self.rooms.values():
            for conn in list(conns):
                await conn.close(code)
        self.rooms.clear()


manager = ConnectionManager()


async def publish_event(company_id: str, event_type: str, payload: Dict[str, Any], topic: str = "all") -> None:
    company_id = str(company_id)
    msg = {"company_id": company_id, "event_type": event_type, "topic": topic, "payload": payload}
    msg = json.loads(json.dumps(msg, default=str))
    await manager.broadcast(company_id, msg, topic)
    client = get_redis_client()
    if client is None:
        return
    try:
        await client.publish(f"company:{company_id}:{topic}", json.dumps(msg))
    except Exception as exc:
        logger.debug("Redis pub/sub publish skipped: %s", exc)


def publish_event_sync(company_id: str, event_type: str, payload: Dict[str, Any], topic: str = "all") -> None:
    """Fire-and-forget helper for sync routes/background threads."""
    logger.info("publish_event_sync called: event=%s topic=%s", event_type, topic)
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(publish_event(company_id, event_type, payload, topic))
        return
    except RuntimeError:
        pass

    loop = manager.loop
    if loop and loop.is_running():
        try:
            loop.call_soon_threadsafe(lambda: loop.create_task(publish_event(company_id, event_type, payload, topic)))
        except Exception as exc:
            logger.debug("publish_event_sync thread fallback skipped: %s", exc)


async def listen_redis_channel(company_id: str, topic: str = "all") -> None:
    company_id = str(company_id)
    client = get_redis_client()
    if client is None:
        return
    pubsub = client.pubsub()
    try:
        await pubsub.subscribe(f"company:{company_id}:{topic}")
        async for raw in pubsub.listen():
            if raw.get("type") != "message":
                continue
            try:
                message = json.loads(raw["data"])
            except Exception:
                continue
            await manager.broadcast(company_id, message, topic)
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        logger.debug("Redis listener stopped for %s: %s", company_id, exc)
    finally:
        try:
            await pubsub.reset()
        except Exception:
            pass