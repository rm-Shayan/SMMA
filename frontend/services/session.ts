/**
 * Session storage — the single owner of auth state on disk.
 *
 * Deliberately dependency-free of axios/React so both `services/api.ts`
 * (interceptors) and `store/auth-provider.tsx` can import it without cycles.
 * Token and active tenant are stored in cookies (js-cookie) so the API client
 * can attach them on every request; the user profile is persisted in
 * localStorage for session restore.
 * Contract: docs/07-api-integration.md §2, docs/08-frontend-architecture.md §3.
 */
import Cookies from "js-cookie";

export type UserRole = "SUPERADMIN" | "CLIENT_OWNER" | "AGENT_OPERATOR" | "TRAINEE";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  name?: string;
}

export interface Session {
  token: string;
  user: SessionUser;
}

const TOKEN_KEY = "smma.token";
const USER_KEY = "smma.user";
const TENANT_KEY = "smma.tenantId";

function readKey(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeKey(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — session simply will not persist */
  }
}

export function getSession(): Session | null {
  const token = Cookies.get(TOKEN_KEY) ?? readKey(TOKEN_KEY);
  const rawUser = readKey(USER_KEY);
  if (!token || !rawUser) return null;
  try {
    return { token, user: JSON.parse(rawUser) as SessionUser };
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return Cookies.get(TOKEN_KEY) ?? readKey(TOKEN_KEY);
}

/** SUPERADMIN's selected tenant context — sent as `x-tenant-id`. */
export function getActiveTenantId(): string | null {
  return Cookies.get(TENANT_KEY) ?? readKey(TENANT_KEY);
}

export function setSession(token: string, user: SessionUser): void {
  Cookies.set(TOKEN_KEY, token, { sameSite: "lax" });
  writeKey(USER_KEY, JSON.stringify(user));
  const tenant = user.tenantId ?? Cookies.get(TENANT_KEY) ?? readKey(TENANT_KEY);
  if (tenant) {
    Cookies.set(TENANT_KEY, tenant, { sameSite: "lax" });
  }
  if (user.tenantId) writeKey(TENANT_KEY, user.tenantId);
}

export function setActiveTenant(tenantId: string | null): void {
  if (tenantId) {
    Cookies.set(TENANT_KEY, tenantId, { sameSite: "lax" });
    writeKey(TENANT_KEY, tenantId);
  } else {
    Cookies.remove(TENANT_KEY);
    writeKey(TENANT_KEY, null);
  }
}

export function clearSession(): void {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(TENANT_KEY);
  writeKey(TOKEN_KEY, null);
  writeKey(USER_KEY, null);
  writeKey(TENANT_KEY, null);
}

export function hasSession(): boolean {
  return getSession() !== null;
}
