import time
import logging
from typing import Callable, Any

logger = logging.getLogger("circuit_breaker")

class CircuitBreakerOpenException(Exception):
    pass

class CircuitBreaker:
    """
    Prevents cascading service failures when external dependencies (LLMs, Stripe) fail.
    States: CLOSED (Normal) -> OPEN (Failing) -> HALF-OPEN (Testing recovery)
    """

    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.last_state_change = time.time()

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        now = time.time()

        if self.state == "OPEN":
            if now - self.last_state_change > self.recovery_timeout:
                self.state = "HALF_OPEN"
                logger.info("Circuit breaker entering HALF_OPEN state.")
            else:
                raise CircuitBreakerOpenException("Circuit is OPEN. Fast-failing external dependency call.")

        try:
            result = await func(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
                logger.info("Circuit breaker reset to CLOSED state.")
            return result
        except Exception as exc:
            self.failure_count += 1
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                self.last_state_change = now
                logger.error("Circuit breaker tripped to OPEN state! Failures: %s", self.failure_count)
            raise exc

# Global Circuit Breakers for external third-party APIs
llm_circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=30.0)
stripe_circuit_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=60.0)

