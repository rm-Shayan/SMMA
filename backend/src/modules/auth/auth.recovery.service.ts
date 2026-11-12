import crypto from 'crypto';
import { pool } from '../../core/database/pool.database';
import { env } from '../../core/config/env.config';
import { logger } from '../../core/config/logger.config';
import { sendAuthMail } from './auth.email';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  revokeAllUserRefreshTokens,
  VERIFY_EMAIL_TTL_SECONDS,
  PASSWORD_RESET_TTL_SECONDS,
} from './auth.tokens';

export async function verifyEmail(token: string): Promise<{ user: { id: string; email: string; role: string; tenantId: string | null; name: string; email_verified: boolean } } | null> {
  const tokenHash = hashToken(token);
  const res = await pool.query(
    `SELECT id, user_id, expires_at, used_at FROM email_verification_tokens WHERE token_hash = $1 LIMIT 1`,
    [tokenHash],
  );
  const row = res.rows[0];
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) return null;

  await pool.query(`UPDATE platform_users SET email_verified = TRUE WHERE id = $1`, [row.user_id]);
  await pool.query(`UPDATE email_verification_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1`, [row.id]);

  const userRes = await pool.query(
    `SELECT id, email, role, tenant_id, full_name, email_verified FROM platform_users WHERE id = $1`,
    [row.user_id],
  );
  const user = userRes.rows[0];
  logger.info({ userId: user.id, email: user.email }, 'Email verified');
  return {
    user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id, name: user.full_name, email_verified: user.email_verified },
  };
}

export async function resendVerification(email: string): Promise<{ sent: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();
  const userRes = await pool.query(`SELECT id, email, full_name, email_verified FROM platform_users WHERE email = $1 LIMIT 1`, [normalizedEmail]);
  const user = userRes.rows[0];
  if (!user || user.email_verified) return { sent: false };

  await pool.query(`DELETE FROM email_verification_tokens WHERE user_id = $1`, [user.id]);
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + VERIFY_EMAIL_TTL_SECONDS * 1000);
  await pool.query(`INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [user.id, tokenHash, expiresAt]);

  const verifyUrl = `${env.BASE_URL.replace(/\/$/, '')}/api/v1/auth/verify-email?token=${token}`;
  await sendAuthMail({
    to: normalizedEmail,
    subject: 'Resend: Verify your SMMA account email',
    text: `Hi ${user.full_name}, verify your email: ${verifyUrl}`,
    html: `<p>Hi ${user.full_name},</p><p>Verify your email address: <a href="${verifyUrl}">Verify Email</a></p><p>Expires in ${Math.round(VERIFY_EMAIL_TTL_SECONDS / 60)} minutes.</p>`,
  });
  return { sent: true };
}

export async function forgotPassword(email: string): Promise<{ sent: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();
  const userRes = await pool.query(`SELECT id, email, full_name, is_active FROM platform_users WHERE email = $1 LIMIT 1`, [normalizedEmail]);
  const user = userRes.rows[0];
  if (!user || !user.is_active) return { sent: true };

  await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [user.id]);
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000);
  await pool.query(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [user.id, tokenHash, expiresAt]);

  const resetUrl = `${env.BASE_URL.replace(/\/$/, '')}/reset-password?token=${token}`;
  await sendAuthMail({
    to: normalizedEmail,
    subject: 'Reset your SMMA account password',
    text: `Hi ${user.full_name}, reset your password: ${resetUrl}`,
    html: `<p>Hi ${user.full_name},</p><p>Reset your password: <a href="${resetUrl}">Reset Password</a></p><p>Expires in ${Math.round(PASSWORD_RESET_TTL_SECONDS / 60)} minutes.</p>`,
  });
  logger.info({ userId: user.id, email: normalizedEmail }, 'Password reset token issued');
  return { sent: true };
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const res = await pool.query(
    `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1 LIMIT 1`,
    [tokenHash],
  );
  const row = res.rows[0];
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) return false;

  const userRes = await pool.query(`SELECT id, is_active FROM platform_users WHERE id = $1 LIMIT 1`, [row.user_id]);
  const user = userRes.rows[0];
  if (!user || !user.is_active) return false;

  await pool.query(`UPDATE platform_users SET password_hash = $1 WHERE id = $2`, [hashPassword(newPassword), row.user_id]);
  await pool.query(`UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1`, [row.id]);
  await revokeAllUserRefreshTokens(row.user_id);
  logger.info({ userId: row.user_id }, 'Password reset completed, all sessions revoked');
  return true;
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string, keepRefreshTokenJti?: string): Promise<boolean> {
  const userRes = await pool.query(`SELECT id, password_hash FROM platform_users WHERE id = $1 LIMIT 1`, [userId]);
  const user = userRes.rows[0];
  if (!user || !verifyPassword(oldPassword, user.password_hash)) return false;

  await pool.query(`UPDATE platform_users SET password_hash = $1 WHERE id = $2`, [hashPassword(newPassword), userId]);
  await revokeAllUserRefreshTokens(userId, keepRefreshTokenJti);
  logger.info({ userId }, 'Password changed, other sessions revoked');
  return true;
}
