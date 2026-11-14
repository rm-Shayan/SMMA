import asyncio
import random
import logging
from functools import wraps
from typing import Callable, Any, Tuple, Type

logger = logging.getLogger("retries")

def with_retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
) -> Callable:
    """
    Intelligent Retry Decorator with Full Jitter and Exponential Backoff.
    - Eliminates thundering herd problem via randomized jitter.
    - Caps backoff to max_delay to prevent thread stalling.
    - Prevents endless loops via strict max_attempts boundary.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            attempt = 1
            while attempt <= max_attempts:
                try:
                    return await func(*args, **kwargs)
                except retryable_exceptions as exc:
                    if attempt == max_attempts:
                        logger.error("Max retries (%s) reached for %s: %s", max_attempts, func.__name__, exc)
                        raise exc

                    # Exponential backoff with Full Jitter
                    exp_backoff = min(max_delay, base_delay * (2 ** (attempt - 1)))
                    jittered_delay = random.uniform(0, exp_backoff)

                    logger.warning(
                        "Attempt %s/%s failed for %s (%s). Retrying in %.2fs...",
                        attempt, max_attempts, func.__name__, exc, jittered_delay
                    )
                    await asyncio.sleep(jittered_delay)
                    attempt += 1

        return wrapper
    return decorator

