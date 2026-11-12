/**
 * Central Axios client for the SMMA AI frontend.
 *
 * Contract: docs/07-api-integration.md (endpoints, headers, status codes)
 *           docs/08-frontend-architecture.md (folder + state conventions)
 *
 * - One shared instance with `baseURL` from NEXT_PUBLIC_API_URL.
 * - Request interceptor  → attaches `Authorization: Bearer <token>` and, for
 *   SUPERADMIN sessions, `x-tenant-id` (explicit `config.tenantId` wins).
 * - Response interceptor → 401 clears the session and redirects to /login
 *   (skipped for the login call itself); 429 keeps `retryAfterSeconds` so the
 *   UI can show a countdown instead of a generic failure.
 * - Everything is thrown as the typed `ApiError` so pages can render distinct
 *   400 / 401 / 403 / 429 / 5xx states.
 */
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { clearSession, getActiveTenantId, getSession } from "./session";

export type { Session, SessionUser, UserRole } from "./session";
export { clearSession, getActiveTenantId, getSession, setActiveTenant, setSession } from "./session";

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace(
  /\/+$/,
  "",
);

/** Generous default; AI endpoints (agent chat) should pass `timeout: 60_000`. */
const DEFAULT_TIMEOUT_MS = 30_000;

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

/** Per-request extras understood by the interceptors. */
declare module "axios" {
  export interface AxiosRequestConfig {
    /** Explicit tenant target (SUPERADMIN). Falls back to the stored active tenant. */
    tenantId?: string;
    /** Skip the automatic 401 → /login redirect (used by the login call). */
    skipAuthRedirect?: boolean;
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

  const tenantId =
    config.tenantId ?? (session?.user?.role === "SUPERADMIN" ? getActiveTenantId() : null);
  if (tenantId) config.headers.set("x-tenant-id", tenantId);

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? "");

    // 401 → session is no longer valid. Never redirect the login call itself.
    if (status === 401 && !error.config?.skipAuthRedirect && !url.includes("/auth/login")) {
      clearSession();
      redirectToLogin();
    }

    const apiError = normalizeError(error);

    // 429 rate limit — surfaced as typed ApiError with retryAfterSeconds for UI countdowns.
    if (status === 429 && typeof window !== "undefined") {
      console.warn(
        `Rate limited${apiError.retryAfterSeconds ? `; retry after ${apiError.retryAfterSeconds}s` : ""}`,
        url,
      );
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
  window.location.href = "/login";
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
