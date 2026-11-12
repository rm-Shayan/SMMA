import crypto from 'crypto';
import { pool } from '../../core/database/pool.database';
import { env } from '../../core/config/env.config';
import { logger } from '../../core/config/logger.config';
import { getRedisClient, isRedisConnected } from '../../core/config/redis.config';
import { sendAuthMail } from './auth.email';
import { hashPassword, verifyPassword, hashToken, generateAuthTokens, VERIFY_EMAIL_TTL_SECONDS } from './auth.tokens';

export * from './auth.tokens';
export * from './auth.recovery.service';

async function recordAuthFailure(identifier: string): Promise<void> {
  const key = `auth:fail:${identifier}`;
  if (isRedisConnected) {
    try {
      const redis = getRedisClient();
      await redis.incr(key);
      await redis.expire(key, 900);
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Auth failure counter Redis failed');
    }
  }
}

async function clearAuthFailures(identifier: string): Promise<void> {
  const key = `auth:fail:${identifier}`;
  if (isRedisConnected) {
    try { const redis = getRedisClient(); await redis.del(key); } catch {}
  }
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; tenantId: string | null; name: string };
}

export async function loginUser(email: string, pass: string, opts?: { deviceInfo?: string; ipAddress?: string }): Promise<LoginResult | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const sql = `SELECT id, tenant_id, email, password_hash, role, full_name, is_active, email_verified FROM platform_users WHERE email = $1 LIMIT 1;`;
  try {
    const res = await pool.query(sql, [normalizedEmail]);
    const user = res.rows[0];
    if (!user || !user.is_active || !user.email_verified || !verifyPassword(pass, user.password_hash)) {
      await recordAuthFailure(normalizedEmail);
      logger.warn({ email: normalizedEmail }, 'Failed login attempt');
      return null;
    }
    await clearAuthFailures(normalizedEmail);
    const tokens = await generateAuthTokens({ userId: user.id, email: user.email, role: user.role, tenantId: user.tenant_id }, opts?.deviceInfo, opts?.ipAddress);
    logger.info({ userId: user.id, email: user.email }, 'User logged in');
    return { token: tokens.accessToken, refreshToken: tokens.refreshToken, user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id, name: user.full_name } };
  } catch (err: any) {
    logger.error({ err: err.message }, 'User login query failed');
    return null;
  }
}

export interface RegisterResult {
  user: { id: string; tenant_id: string | null; email: string; role: string; full_name: string; email_verified: boolean };
  emailVerificationRequired: boolean;
}

export async function registerUser(data: {
  email: string;
  password: string;
  fullName: string;
  companyName?: string;
  role?: 'SUPERADMIN' | 'CLIENT_OWNER' | 'AGENT_OPERATOR' | 'TRAINEE';
  tenantId?: string | null;
}): Promise<RegisterResult> {
  const email = data.email.toLowerCase().trim();
  const existing = await pool.query(`SELECT id FROM platform_users WHERE email = $1 LIMIT 1`, [email]);
  if (existing.rows.length > 0) throw new Error('EMAIL_ALREADY_REGISTERED');

  const role = data.role || 'CLIENT_OWNER';
  let tenantId = data.tenantId || null;

  if (!tenantId && role === 'CLIENT_OWNER') {
    const company = (data.companyName || `${data.fullName}'s Agency`).trim();
    const tRes = await pool.query(
      `INSERT INTO tenants (company_name, brand_voice, is_internal, current_plan, notification_email)
       VALUES ($1, 'Professional, authoritative, high-conversion', false, 'FREE_STARTER', $2) RETURNING id;`,
      [company, email]
    );
    tenantId = tRes.rows[0].id;
  }

  if (role !== 'SUPERADMIN' && !tenantId) throw new Error('TENANT_ID_REQUIRED');

  const userRes = await pool.query(
    `INSERT INTO platform_users (tenant_id, email, password_hash, role, full_name, email_verified)
     VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING id, tenant_id, email, role, full_name, email_verified`,
    [tenantId, email, hashPassword(data.password), role, data.fullName],
  );
  const user = userRes.rows[0];

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + VERIFY_EMAIL_TTL_SECONDS * 1000);
  await pool.query(`INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [user.id, tokenHash, expiresAt]);

  const verifyUrl = `${env.BASE_URL.replace(/\/$/, '')}/api/v1/auth/verify-email?token=${token}`;
  await sendAuthMail({
    to: email,
    subject: 'Verify your SMMA account email',
    text: `Hi ${data.fullName}, please verify your email: ${verifyUrl}`,
    html: `<p>Hi ${data.fullName},</p><p>Please verify your email address: <a href="${verifyUrl}">Verify Email</a></p><p>Expires in ${Math.round(VERIFY_EMAIL_TTL_SECONDS / 60)} minutes.</p>`,
  });

  logger.info({ userId: user.id, email }, 'New user registered, email verification pending');
  return { user: { id: user.id, tenant_id: user.tenant_id, email: user.email, role: user.role, full_name: user.full_name, email_verified: user.email_verified }, emailVerificationRequired: true };
}
