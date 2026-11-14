import asyncio
import logging

from fastapi import WebSocket

logger = logging.getLogger("ws-buffer")

MAX_QUEUE = 1000
MAX_CONSECUTIVE_DROPS = 100


class BufferedConnection:
    """Per-socket bounded queue with a dedicated writer task.

    Slow consumers cannot block producers or exhaust memory: the oldest event is
    dropped when the queue is full, and the socket is closed (1013) after too
    many consecutive drops.
    """

    def __init__(self, company_id: str, ws: WebSocket, topic: str = "all") -> None:
        self.company_id = str(company_id)
        self.ws = ws
        self.topics: set[str] = {topic}
        self.queue: asyncio.Queue[dict] = asyncio.Queue(maxsize=MAX_QUEUE)
        self.task: asyncio.Task | None = None
        self.drops = 0
        self.closed = False
        self._closing = False

    def start(self) -> None:
        self.task = asyncio.create_task(self._writer(), name=f"ws-writer-{id(self)}")

    async def _writer(self) -> None:
        try:
            while True:
                message = await self.queue.get()
                await self.ws.send_json(message)
        except asyncio.CancelledError:
            return
        except Exception as exc:
            logger.debug("WS writer stopped: %s", exc)
            await self.close(1011)

    def enqueue(self, message: dict) -> bool:
        if self.closed:
            return False
        try:
            self.queue.put_nowait(message)
            return True
        except asyncio.QueueFull:
            try:
                self.queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
            self.drops += 1
            if self.drops > MAX_CONSECUTIVE_DROPS:
                if not self._closing:
                    self._closing = True
                    logger.warning("Closing slow WS consumer after %s consecutive drops", self.drops)
                    asyncio.create_task(self.close(1013))
                return False
            try:
                self.queue.put_nowait(message)
            except asyncio.QueueFull:
                pass
            return True

    def touch(self) -> None:
        self.drops = 0

    async def close(self, code: int = 1000) -> None:
        if self.closed:
            return
        self.closed = True
        if self.task:
            self.task.cancel()
        try:
            await self.ws.close(code=code)
        except Exception:
            pass