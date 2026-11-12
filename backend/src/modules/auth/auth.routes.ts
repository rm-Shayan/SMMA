import { Router } from 'express';
import {
  handleLogin,
  handleCreateUser,
  handleGetMe,
  handleRegister,
  handleRefresh,
  handleLogout,
  handleLogoutAll,
  handleForgotPassword,
  handleResetPassword,
  handleVerifyEmail,
  handleResendVerification,
  handleChangePassword,
} from './auth.controller';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';
import { loginRateLimiter, registerRateLimiter, forgotPasswordRateLimiter } from '../../core/middlewares/auth-rate-limiter.middleware';

export const authRouter = Router();

// Public authentication
authRouter.post('/register', registerRateLimiter, handleRegister);
authRouter.post('/login', loginRateLimiter, handleLogin);
authRouter.post('/refresh', handleRefresh);
authRouter.post('/logout', handleLogout);
authRouter.post('/logout-all', requireAuth, handleLogoutAll);

// Password recovery
authRouter.post('/forgot-password', forgotPasswordRateLimiter, handleForgotPassword);
authRouter.post('/reset-password', handleResetPassword);

// Email verification
authRouter.get('/verify-email', handleVerifyEmail);
authRouter.post('/resend-verification', forgotPasswordRateLimiter, handleResendVerification);

// Authenticated user management
authRouter.get('/me', requireAuth, handleGetMe);
authRouter.post('/change-password', requireAuth, handleChangePassword);
authRouter.post(
  '/create-user',
  requireAuth,
  requireRole(['SUPERADMIN', 'CLIENT_OWNER']),
  handleCreateUser,
);
