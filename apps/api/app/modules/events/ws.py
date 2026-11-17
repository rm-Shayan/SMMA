import json
import logging
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from ...core.pubsub import manager
from ...core.security import decode_token

logger = logging.getLogger("ws")
router = APIRouter()


async def _handle_ws(ws: WebSocket, company_id: str, topic: str, token: str | None = None) -> None:
    if token:
        payload = decode_token(token)
        if not payload or payload.get("companyId") != company_id:
            await ws.close(code=4003)
            return

    conn = await manager.connect(company_id, ws, topic)
    try:
        while True:
            msg = await ws.receive_text()
            if msg == "ping":
                await ws.send_text("pong")
                continue
            try:
                data = json.loads(msg)
                if data.get("type") == "ping":
                    await ws.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        await manager.disconnect(company_id, conn)


@router.websocket("/ws/{company_id}")
async def ws_tenant(ws: WebSocket, company_id: str, topic: str = Query("all"), token: str = Query(None)):
    """Tenant-isolated WebSocket. Client may filter by topic via query param."""
    await _handle_ws(ws, company_id, topic, token)


@router.websocket("/ws/outbox/{company_id}")
async def ws_outbox(ws: WebSocket, company_id: str, token: str = Query(None)):
    """Dedicated outbox job state change stream."""
    await _handle_ws(ws, company_id, "outbox", token)


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


@router.websocket("/ws/campaigns/{company_id}")
async def ws_campaigns(ws: WebSocket, company_id: str, token: str = Query(None)):
    """Live campaign lifecycle + delivery counter stream."""
    await _handle_ws(ws, company_id, "campaigns", token)


@router.websocket("/ws/{topic}/{company_id}")
async def ws_topic(ws: WebSocket, topic: str, company_id: str, token: str = Query(None)):
    """Generic topic stream: leads, inbox, approvals, knowledge, media, etc."""
    await _handle_ws(ws, company_id, topic, token)
