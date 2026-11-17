/**
 * Silent access-token refresh.
 *
 * When the API answers `401` because the JWT expired, the transport asks the
 * backend to mint a new token (`POST /auth/refresh`) and replays the original
 * request — the user never sees a redirect to the login screen.
 *
 * Refreshes are *single flight*: a burst of parallel requests that all fail
 * with 401 triggers exactly one refresh round-trip; the other requests wait
 * for the same promise.
 */

import type { AxiosInstance } from "axios";
import { getSession, setToken } from "./session";

/** Backend endpoint that exchanges a (possibly expired) token for a fresh one. */
export const REFRESH_PATH =
  process.env.NEXT_PUBLIC_API_REFRESH_PATH || "/auth/refresh";

/** Endpoints that must never trigger a refresh loop. */
export const NON_REFRESHABLE_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/signup",
  "/auth/logout",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export function isRefreshablePath(url: string): boolean {
  return !NON_REFRESHABLE_PATHS.some((path) => url.includes(path));
}

interface RefreshResponse {
  token?: string;
  access_token?: string;
}

let inflight: Promise<string | null> | null = null;

async function requestTokenRefresh(client: AxiosInstance): Promise<string | null> {
  const session = getSession();
  if (!session?.token) return null;

  try {
    const { data } = await client.post<RefreshResponse>(
      REFRESH_PATH,
      {},
      {
        headers: { Authorization: `Bearer ${session.token}` },
        // Never bounce to the login screen or recurse into the refresh flow.
        skipAuthRedirect: true,
        skipAuthRefresh: true,
        skipRateLimitRetry: true,
      },
    );

    const token = data?.token ?? data?.access_token ?? null;
    if (!token) return null;

    setToken(token);
    return token;
  } catch {
    return null;
  }
}

/**
 * Returns a fresh access token, or `null` when the session cannot be renewed.
 * Concurrent callers share a single in-flight refresh.
 */
export function refreshAccessToken(client: AxiosInstance): Promise<string | null> {
  if (!inflight) {
    inflight = requestTokenRefresh(client).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/** Test seam — drops any in-flight refresh. */
export function resetRefreshState(): void {
  inflight = null;
}
