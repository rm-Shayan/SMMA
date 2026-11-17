import Cookies from "js-cookie";

export type UserRole = "SUPERADMIN" | "CLIENT_OWNER" | "AGENT_OPERATOR" | "TRAINEE" | "COMPANY_ADMIN" | "MANAGER" | "EMPLOYEE";

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

const TOKEN_KEY = "styre.token";
const LEGACY_TOKEN_KEY = "smma.token";
const USER_KEY = "styre.user";
const LEGACY_USER_KEY = "smma.user";
const TENANT_KEY = "styre.tenantId";
const LEGACY_TENANT_KEY = "smma.tenantId";

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
  const token = Cookies.get(TOKEN_KEY) ?? Cookies.get(LEGACY_TOKEN_KEY) ?? readKey(TOKEN_KEY) ?? readKey(LEGACY_TOKEN_KEY);
  const rawUser = readKey(USER_KEY) ?? readKey(LEGACY_USER_KEY);
  if (!token || !rawUser) return null;
  try {
    return { token, user: JSON.parse(rawUser) as SessionUser };
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return Cookies.get(TOKEN_KEY) ?? Cookies.get(LEGACY_TOKEN_KEY) ?? readKey(TOKEN_KEY) ?? readKey(LEGACY_TOKEN_KEY);
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

/**
 * Replaces only the access token, keeping the cached user and tenant context.
 * Used by the silent-refresh flow so an expired session can be extended
 * without a full re-login.
 */
export function setToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, { sameSite: "lax" });
  writeKey(TOKEN_KEY, token);
}

export function clearSession(): void {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(LEGACY_TOKEN_KEY);
  Cookies.remove(TENANT_KEY);
  Cookies.remove(LEGACY_TENANT_KEY);
  Cookies.remove(USER_KEY);
  Cookies.remove(LEGACY_USER_KEY);
  writeKey(TOKEN_KEY, null);
  writeKey(LEGACY_TOKEN_KEY, null);
  writeKey(USER_KEY, null);
  writeKey(LEGACY_USER_KEY, null);
  writeKey(TENANT_KEY, null);
  writeKey(LEGACY_TENANT_KEY, null);
}

export function hasSession(): boolean {
  return Boolean(getToken());
}
