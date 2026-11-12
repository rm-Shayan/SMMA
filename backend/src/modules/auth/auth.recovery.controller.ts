import { Request, Response } from 'express';
import {
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
} from './auth.service';
import {
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from './auth.schemas';

export async function handleForgotPassword(req: Request, res: Response): Promise<void> {
  const parsed = ForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }
  await forgotPassword(parsed.data.email);
  res.status(200).json({ success: true, message: 'If an account exists, a password reset link has been sent.' });
}

export async function handleResetPassword(req: Request, res: Response): Promise<void> {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }
  const ok = await resetPassword(parsed.data.token, parsed.data.password);
  if (!ok) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
    return;
  }
  res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
}

export async function handleVerifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Validation Error', message: 'Verification token is required' });
    return;
  }
  const result = await verifyEmail(token);
  if (!result) {
    res.status(400).json({ error: 'Invalid or expired verification token' });
    return;
  }
  res.status(200).json({ success: true, message: 'Email verified successfully. You can now log in.', user: result.user });
}

export async function handleResendVerification(req: Request, res: Response): Promise<void> {
  const parsed = ForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }
  const result = await resendVerification(parsed.data.email);
  res.status(200).json({ success: true, sent: result.sent, message: 'If an unverified account exists, a verification email has been sent.' });
}

export async function handleChangePassword(req: Request, res: Response): Promise<void> {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const ok = await changePassword(req.user.userId, parsed.data.oldPassword, parsed.data.newPassword, req.user.jti);
  if (!ok) {
    res.status(401).json({ error: 'Unauthorized', message: 'Current password is incorrect' });
    return;
  }
  res.status(200).json({ success: true, message: 'Password changed. Other active sessions were revoked.' });
}
