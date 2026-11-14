import time
import asyncio
import logging
from typing import Optional
from .config import settings

logger = logging.getLogger("throttler")

class TokenBucketThrottler:
    """
    Intelligent Leaky/Token Bucket API Throttler.
    Smooths out high-burst traffic (e.g. bulk outreach or concurrent agent executions)
    by pacing requests instead of abruptly dropping them.
    """

    def __init__(self, rate: float = 5.0, capacity: float = 10.0):
        self.rate = rate  # Tokens refilled per second
        self.capacity = capacity  # Maximum burst capacity
        self.tokens = capacity
        self.last_update = time.time()
        self._lock = asyncio.Lock()

    async def acquire(self, tokens: float = 1.0, max_wait_sec: float = 5.0) -> bool:
        async with self._lock:
            now = time.time()
            elapsed = now - self.last_update
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_update = now

            if self.tokens >= tokens:
                self.tokens -= tokens
                return True

            needed = tokens - self.tokens
            wait_time = needed / self.rate
            if wait_time > max_wait_sec:
                return False

            await asyncio.sleep(wait_time)
            self.tokens = 0
            self.last_update = time.time()
            return True

# Global throttlers for high-load workloads
llm_throttler = TokenBucketThrottler(rate=3.0, capacity=6.0)
outbox_throttler = TokenBucketThrottler(rate=1.0, capacity=5.0)  # Safe anti-ban email pacing

