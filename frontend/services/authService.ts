import { apiPost, apiGet } from "@/services/api";
import type { AuthResponse, User } from "@/types/auth";

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/auth/login", credentials, { skipAuthRedirect: true });
}

export async function getCurrentUserApi(): Promise<User> {
  const res = await apiGet<{ success: boolean; user: User }>("/auth/me", {
    skipAuthRedirect: true,
  });
  return res.user;
}
