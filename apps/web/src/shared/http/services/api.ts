import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { markApiOffline, markApiOnline } from "./apiHealth";
import { computeRateLimitDelay, RATE_LIMIT_MAX_RETRIES, sleep } from "./backoff";
import { clearSession, getActiveTenantId, getSession } from "./session";
import { isRefreshablePath, refreshAccessToken } from "./tokenRefresh";

export type { Session, SessionUser, UserRole } from "./session";
export { clearSession, getActiveTenantId, getSession, setActiveTenant, setSession } from "./session";

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(
  /\/+$/,
  "",
);

const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;
  readonly retryAfterSeconds?: number;

  constructor(status: number, message: string, details?: unknown, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
  details?: unknown;
  retryAfterSeconds?: number;
}

declare module "axios" {
  export interface AxiosRequestConfig {
    tenantId?: string;
    /** Do not clear the session / redirect to /login when a 401 is returned. */
    skipAuthRedirect?: boolean;
    /** Do not attempt a silent token refresh for this request. */
    skipAuthRefresh?: boolean;
    /** Do not replay this request when it is rate limited. */
    skipRateLimitRetry?: boolean;
    /** Internal: number of silent-refresh replays already performed. */
    authRetryCount?: number;
    /** Internal: number of rate-limit replays already performed. */
    rateLimitRetryCount?: number;
  }
}

/* ------------------------------- instance ------------------------------- */

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = getSession();

  if (session?.token) {
    config.headers.set("Authorization", `Bearer ${session.token}`);
  }

  // Attach the tenant for every session (matches the user's own company, so
  // backend cross-tenant checks pass); explicit config.tenantId (SUPERADMIN
  // tenant switching) wins. Backend also falls back to the token's companyId.
  const tenantId = config.tenantId ?? getActiveTenantId() ?? session?.user?.tenantId ?? null;
  if (tenantId) config.headers.set("x-tenant-id", tenantId);

  return config;
});

api.interceptors.response.use(
  (response) => {
    markApiOnline();
    return response;
  },
  async (error: AxiosError<ApiErrorPayload>) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? "");
    const config = error.config;
    const apiError = normalizeError(error);

    // No response at all → the backend is unreachable (refused, DNS, timeout).
    if (!error.response) {
      markApiOffline(apiError.message);
      throw apiError;
    }

    // 429 rate limit — replay the request with an exponential backoff that
    // honours the server supplied `Retry-After` header.
    if (status === 429 && config && !config.skipRateLimitRetry) {
      const attempt = config.rateLimitRetryCount ?? 0;
      if (attempt < RATE_LIMIT_MAX_RETRIES) {
        const delay = computeRateLimitDelay(attempt, apiError.retryAfterSeconds);
        if (typeof window !== "undefined") {
          console.warn(
            `Rate limited${apiError.retryAfterSeconds ? `; retry after ${apiError.retryAfterSeconds}s` : ""}; replaying in ${delay}ms`,
            url,
          );
        }
        await sleep(delay);
        config.rateLimitRetryCount = attempt + 1;
        return api.request(config);
      }
    }

    // 401 — try a silent token refresh before giving up on the session.
    if (
      status === 401 &&
      config &&
      !config.skipAuthRedirect &&
      !config.skipAuthRefresh &&
      isRefreshablePath(url)
    ) {
      const alreadyRetried = config.authRetryCount ?? 0;
      if (alreadyRetried === 0) {
        const token = await refreshAccessToken(api);
        if (token) {
          config.authRetryCount = 1;
          config.headers.set("Authorization", `Bearer ${token}`);
          return api.request(config);
        }
      }

      // Refresh not possible (revoked, deactivated or too old) → end session.
      clearSession();
      redirectToLogin();
    }

    throw apiError;
  },
);

/* ------------------------------- helpers ------------------------------- */

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  if (unauthorizedHandler) {
    unauthorizedHandler();
    return;
  }
  // Fallback when no router-based handler is registered (module scope sits outside React).
  const loginUrl = new URL("/login", window.location.origin);
  loginUrl.searchParams.set("next", window.location.pathname + window.location.search);
  window.location.href = loginUrl.toString();
}

/**
 * Registered by the auth provider so 401s navigate with the Next.js router
 * (client-side navigation) instead of a full page reload.
 */
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function messageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "The request was invalid. Please check the highlighted fields.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested record was not found.";
    case 429:
      return "Too many requests. Please slow down and try again shortly.";
    default:
      return status >= 500
        ? "The server encountered an error. Please try again."
        : `Request failed with status ${status}`;
  }
}

function normalizeError(error: AxiosError<ApiErrorPayload>): ApiError {
  const response = error.response;

  if (!response) {
    if (error.code === "ERR_CANCELED") return new ApiError(0, "Request cancelled.");
    if (error.code === "ECONNABORTED" || /timeout/i.test(error.message)) {
      return new ApiError(0, "The request timed out. Please try again.");
    }
    return new ApiError(0, "Network error. Check your connection and the API base URL.");
  }

  const payload = response.data;
  const headerRetry = Number(response.headers?.["retry-after"]);
  const retryAfterSeconds =
    Number.isFinite(headerRetry) && headerRetry > 0
      ? headerRetry
      : payload?.retryAfterSeconds;

  const message =
    payload?.message || payload?.error || messageForStatus(response.status);

  return new ApiError(response.status, message, payload?.details, retryAfterSeconds);
}

/* ------------------------------ verb helpers ---------------------------- */

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const { data } = await api.request<T>(config);
  return data;
}

export const apiGet = <T>(path: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, url: path, method: "GET" });

export const apiPost = <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
  request<T>({ ...config, url: path, method: "POST", data: body });

export const apiPatch = <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
  request<T>({ ...config, url: path, method: "PATCH", data: body });

export const apiPut = <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
  request<T>({ ...config, url: path, method: "PUT", data: body });

export const apiDelete = <T>(path: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, url: path, method: "DELETE" });
