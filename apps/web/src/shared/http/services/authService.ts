import { apiPost, apiGet } from "@/services/api";
import type { AuthResponse, RawAuthUser, User, UserRole } from "@/types/auth";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

export interface InvitePayload {
  email: string;
  role: "company_admin" | "manager" | "employee";
}

export interface InviteInfo {
  token: string;
  email: string;
  role: string;
  companyName?: string;
  expiresAt?: string;
  url?: string;
}

/* --------------------------- role normalization -------------------------- */

/**
 * Backend snake_case roles (ERD.sql user_role enum) → frontend SCREAMING roles.
 * Unknown values are passed through uppercased so new backend roles still
 * render instead of crashing ROLE_LABEL lookups.
 */
export function normalizeRole(raw?: string | null): UserRole {
  switch ((raw || "").toLowerCase()) {
    case "super_admin":
    case "superadmin":
      return "SUPERADMIN";
    case "company_admin":
      return "COMPANY_ADMIN";
    case "manager":
      return "MANAGER";
    case "employee":
      return "EMPLOYEE";
    case "client_owner":
      return "CLIENT_OWNER";
    case "agent_operator":
      return "AGENT_OPERATOR";
    case "trainee":
      return "TRAINEE";
    default:
      return (raw?.toUpperCase() as UserRole) || "EMPLOYEE";
  }
}

/** Maps any backend user shape (login/me/signup) to the frontend `User`. */
export function normalizeAuthUser(raw: RawAuthUser): User {
  const tenantId = raw.tenantId ?? raw.companyId ?? raw.company_id ?? null;
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name ?? undefined,
    role: normalizeRole(raw.role),
    tenantId,
  };
}

function mapAuthResponse(res: {
  success: boolean;
  token: string;
  user: RawAuthUser;
}): AuthResponse {
  return {
    success: res.success,
    token: res.token,
    user: normalizeAuthUser(res.user),
  };
}

/* ------------------------------- endpoints ------------------------------- */

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await apiPost<{ success: boolean; token: string; user: RawAuthUser }>(
    "/auth/login",
    credentials,
    { skipAuthRedirect: true },
  );
  return mapAuthResponse(res);
}

export async function signupApi(payload: SignupPayload): Promise<AuthResponse> {
  const res = await apiPost<{ success: boolean; token: string; user: RawAuthUser }>(
    "/auth/signup",
    payload,
    { skipAuthRedirect: true },
  );
  return mapAuthResponse(res);
}

export async function getCurrentUserApi(): Promise<User> {
  const res = await apiGet<{ success: boolean; user: RawAuthUser }>("/auth/me", {
    skipAuthRedirect: true,
  });
  return normalizeAuthUser(res.user);
}

export async function createInviteApi(payload: InvitePayload): Promise<InviteInfo> {
  const res = await apiPost<{ success: boolean; invite: InviteInfo }>(
    "/auth/invites",
    payload,
  );
  return res.invite;
}

export async function getInviteApi(token: string): Promise<InviteInfo> {
  const res = await apiGet<{ success: boolean; invite: InviteInfo }>(
    `/auth/invites/${encodeURIComponent(token)}`,
    { skipAuthRedirect: true },
  );
  return res.invite;
}

export async function acceptInviteApi(
  token: string,
  payload: { name: string; password: string },
): Promise<{ success: boolean; user: User }> {
  const res = await apiPost<{ success: boolean; user: RawAuthUser }>(
    `/auth/invites/${encodeURIComponent(token)}/accept`,
    payload,
    { skipAuthRedirect: true },
  );
  return { success: res.success, user: normalizeAuthUser(res.user) };
}

export async function forgotPasswordApi(email: string): Promise<{
  success: boolean;
  message?: string;
  resetUrl?: string;
}> {
  return apiPost("/auth/forgot-password", { email }, { skipAuthRedirect: true });
}

export async function resetPasswordApi(payload: {
  token: string;
  password: string;
}): Promise<{ success: boolean }> {
  return apiPost("/auth/reset-password", payload, { skipAuthRedirect: true });
}
