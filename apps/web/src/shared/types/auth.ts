export type UserRole =
  | "SUPERADMIN"
  | "CLIENT_OWNER"
  | "COMPANY_ADMIN"
  | "MANAGER"
  | "AGENT_OPERATOR"
  | "TRAINEE"
  | "EMPLOYEE";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  tenantId: string | null;
}

export interface RawAuthUser {
  id: string;
  email: string;
  name?: string | null;
  company_id?: string | null;
  companyId?: string | null;
  tenantId?: string | null;
  role?: string | null;
  status?: string | null;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
