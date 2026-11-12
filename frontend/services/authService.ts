import { apiPost, apiGet } from "@/services/api";
import type { AuthResponse, User, RegisterCredentials } from "@/types/auth";

export interface LoginCredentials {
  email: string;
  password: string;
  deviceInfo?: string;
}

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/auth/login", credentials, { skipAuthRedirect: true });
}

export async function registerApi(data: RegisterCredentials): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/auth/register", data, { skipAuthRedirect: true });
}

export async function getCurrentUserApi(): Promise<User> {
  const res = await apiGet<{ success: boolean; user: User }>("/auth/me", {
    skipAuthRedirect: true,
  });
  return res.user;
}

export async function refreshTokenApi(refreshToken: string): Promise<{ success: boolean; token: string; refreshToken: string }> {
  return apiPost("/auth/refresh", { refreshToken }, { skipAuthRedirect: true });
}

export async function logoutApi(refreshToken?: string): Promise<{ success: boolean; message: string }> {
  return apiPost("/auth/logout", { refreshToken }, { skipAuthRedirect: true });
}

export async function forgotPasswordApi(email: string): Promise<{ success: boolean; message: string }> {
  return apiPost("/auth/forgot-password", { email }, { skipAuthRedirect: true });
}

export async function resetPasswordApi(token: string, password: string): Promise<{ success: boolean; message: string }> {
  return apiPost("/auth/reset-password", { token, password }, { skipAuthRedirect: true });
}

export async function verifyEmailApi(token: string): Promise<{ success: boolean; message: string; user?: User }> {
  return apiGet(`/auth/verify-email?token=${encodeURIComponent(token)}`, { skipAuthRedirect: true });
}

export async function resendVerificationApi(email: string): Promise<{ success: boolean; sent: boolean; message: string }> {
  return apiPost("/auth/resend-verification", { email }, { skipAuthRedirect: true });
}

export async function changePasswordApi(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return apiPost("/auth/change-password", { oldPassword, newPassword });
}
