import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  deviceInfo: z.string().optional(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR', 'TRAINEE']).optional(),
  tenantId: z.string().uuid().optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  companyName: z.string().min(2).optional(),
  role: z.enum(['CLIENT_OWNER', 'AGENT_OPERATOR', 'TRAINEE']).optional(),
  tenantId: z.string().uuid().optional(),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const LogoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(8),
});
