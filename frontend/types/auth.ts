export type UserRole = "SUPERADMIN" | "CLIENT_OWNER" | "AGENT_OPERATOR" | "TRAINEE";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  tenantId: string | null;
  emailVerified?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  user: User;
  emailVerificationRequired?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  tenantId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
