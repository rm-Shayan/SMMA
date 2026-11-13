import asyncio
import json
import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.config import settings
from app.core.pubsub import manager, listen_redis_channel

router = APIRouter(tags=["WebSockets"])

def authenticate_ws(token: str | None) -> dict:
    if not token:
        return {}
    try:
        return jwt.decode(token, settings["jwt_secret"], algorithms=["HS256"])
    except Exception:
        return {}

async def _handle_ws(ws: WebSocket, company_id: str, topic: str, token: str | None):
    if token:
        user = authenticate_ws(token)
        if not user or user.get("company_id") != company_id:
            await ws.close(code=1008)
            return

    await manager.connect(company_id, ws, topic)
    task = asyncio.create_task(listen_redis_channel(company_id, topic))
    try:
        while True:
            text = await ws.receive_text()
            if text == "ping":
                await ws.send_text("pong")
                continue
            try:
                cmd = json.loads(text)
                if cmd.get("action") == "subscribe" and cmd.get("topic"):
                    manager.subscribe(ws, cmd["topic"])
                    await ws.send_json({"subscribed": cmd["topic"]})
                elif cmd.get("action") == "unsubscribe" and cmd.get("topic"):
                    manager.unsubscribe(ws, cmd["topic"])
                    await ws.send_json({"unsubscribed": cmd["topic"]})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(company_id, ws)
        task.cancel()
    except Exception:
        manager.disconnect(company_id, ws)
        task.cancel()

@router.websocket("/ws/{company_id}")
async def ws_all(ws: WebSocket, company_id: str, token: str = Query(None)):
    """Tenant master WebSocket stream."""
    await _handle_ws(ws, company_id, "all", token)

@router.websocket("/ws/agents/{company_id}")
async def ws_agents(ws: WebSocket, company_id: str, token: str = Query(None)):
    """Dedicated WebSocket for live agent executions, plan steps & tokens."""
    await _handle_ws(ws, company_id, "agents", token)

@router.websocket("/ws/copilot/{company_id}")
async def ws_copilot(ws: WebSocket, company_id: str, token: str = Query(None)):
    """Dedicated bi-directional Copilot chat socket."""
    await _handle_ws(ws, company_id, "copilot", token)

@router.websocket("/ws/notifications/{company_id}")
async def ws_notifications(ws: WebSocket, company_id: str, token: str = Query(None)):
    """Dedicated high-priority alerts and approval requests socket."""
    await _handle_ws(ws, company_id, "notifications", token)
