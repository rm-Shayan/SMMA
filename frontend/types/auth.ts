export type UserRole = "SUPERADMIN" | "CLIENT_OWNER" | "AGENT_OPERATOR" | "TRAINEE";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  tenantId: string | null;
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
