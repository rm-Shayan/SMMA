/**
 * Backoff helpers for rate-limited (HTTP 429) requests.
 *
 * The API is protected by a per-IP / per-tenant rate limiter, so a burst of
 * parallel dashboard queries can legitimately produce a 429. Instead of
 * surfacing the error immediately the transport waits and replays the request.
 */

/** Maximum number of replays for a single rate-limited request. */
export const RATE_LIMIT_MAX_RETRIES = 3;

/** Delay of the first replay when the server does not send `Retry-After`. */
export const RATE_LIMIT_BASE_DELAY_MS = 500;

/** Upper bound for the exponential delay. */
export const RATE_LIMIT_MAX_DELAY_MS = 8_000;

/** Upper bound for a server supplied `Retry-After` value. */
export const RATE_LIMIT_MAX_RETRY_AFTER_MS = 60_000;

/** Fraction of the delay used as random jitter to avoid retry storms. */
const JITTER_RATIO = 0.25;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Computes how long to wait before replaying a rate-limited request.
 *
 * `attempt` is zero-based: 0 for the first replay.
 */
export function computeRateLimitDelay(
  attempt: number,
  retryAfterSeconds?: number,
): number {
  if (typeof retryAfterSeconds === "number" && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, RATE_LIMIT_MAX_RETRY_AFTER_MS);
  }

  const safeAttempt = Math.max(0, attempt);
  const exponential = RATE_LIMIT_BASE_DELAY_MS * 2 ** safeAttempt;
  const capped = Math.min(exponential, RATE_LIMIT_MAX_DELAY_MS);
  const jitter = Math.round(capped * JITTER_RATIO * Math.random());
  return capped + jitter;
}
