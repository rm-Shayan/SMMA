import asyncio
import json
import logging
from typing import Any, Dict, Set
from fastapi import WebSocket
from app.core.config import settings

logger = logging.getLogger("pubsub")

class ConnectionManager:
    """Manages tenant-isolated, topic-based real-time WebSocket connections."""

    def __init__(self) -> None:
        self.connections: Dict[str, Set[WebSocket]] = {}
        self.topics: Dict[WebSocket, Set[str]] = {}

    async def connect(self, company_id: str, ws: WebSocket, topic: str = "all") -> None:
        await ws.accept()
        if company_id not in self.connections:
            self.connections[company_id] = set()
        self.connections[company_id].add(ws)
        if ws not in self.topics:
            self.topics[ws] = set()
        self.topics[ws].add(topic)

    def subscribe(self, ws: WebSocket, topic: str) -> None:
        if ws in self.topics:
            self.topics[ws].add(topic)

    def unsubscribe(self, ws: WebSocket, topic: str) -> None:
        if ws in self.topics:
            self.topics[ws].discard(topic)

    def disconnect(self, company_id: str, ws: WebSocket) -> None:
        if company_id in self.connections:
            self.connections[company_id].discard(ws)
            if not self.connections[company_id]:
                del self.connections[company_id]
        if ws in self.topics:
            del self.topics[ws]

    async def broadcast(self, company_id: str, message: Dict[str, Any], topic: str = "all") -> None:
        conns = list(self.connections.get(company_id, []))
        stale = []
        for ws in conns:
            subbed = self.topics.get(ws, {"all"})
            if "all" in subbed or topic in subbed:
                try:
                    await ws.send_json(message)
                except Exception:
                    stale.append(ws)
        for s in stale:
            self.disconnect(company_id, s)

manager = ConnectionManager()

def publish_event_sync(company_id: str, event_type: str, payload: Dict[str, Any], topic: str = "all") -> None:
    """Synchronous helper for background threads to broadcast WebSocket events."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(publish_event(company_id, event_type, payload, topic))
        else:
            loop.run_until_complete(publish_event(company_id, event_type, payload, topic))
    except Exception:
        pass

async def publish_event(company_id: str, event_type: str, payload: Dict[str, Any], topic: str = "all") -> None:
    msg = {"company_id": company_id, "event_type": event_type, "topic": topic, "payload": payload}
    await manager.broadcast(company_id, msg, topic)
    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(settings["redis_url"], decode_responses=True)
        await client.publish(f"company:{company_id}:{topic}", json.dumps(msg))
        await client.aclose()
    except Exception as exc:
        logger.debug("Redis pub/sub publish skipped: %s", exc)

async def listen_redis_channel(company_id: str, topic: str = "all") -> None:
    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(settings["redis_url"], decode_responses=True)
        pubsub = client.pubsub()
        await pubsub.subscribe(f"company:{company_id}:{topic}")
        async for msg in pubsub.listen():
            if msg.get("type") == "message":
                await manager.broadcast(company_id, json.loads(msg["data"]), topic)
    except Exception as exc:
        logger.debug("Redis listener stopped for %s: %s", company_id, exc)
