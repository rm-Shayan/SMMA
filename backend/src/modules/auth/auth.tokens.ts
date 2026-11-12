import crypto from 'crypto';
import { pool } from '../../core/database/pool.database';
import { env } from '../../core/config/env.config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'SUPERADMIN' | 'CLIENT_OWNER' | 'AGENT_OPERATOR' | 'TRAINEE';
  tenantId: string | null;
  type?: 'access' | 'refresh';
  jti?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const ACCESS_TTL_SECONDS = Number(env.ACCESS_TOKEN_EXPIRY_MINUTES || 15) * 60;
export const REFRESH_TTL_SECONDS = Number(env.REFRESH_TOKEN_EXPIRY_DAYS || 7) * 86400;
export const VERIFY_EMAIL_TTL_SECONDS = Number(env.EMAIL_VERIFICATION_EXPIRY_MINUTES || 1440) * 60;
export const PASSWORD_RESET_TTL_SECONDS = Number(env.PASSWORD_RESET_EXPIRY_MINUTES || 60) * 60;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

export function createAuthToken(payload: TokenPayload, expiresInSeconds = ACCESS_TTL_SECONDS): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', env.JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function createAccessToken(payload: Omit<TokenPayload, 'exp'>): string {
  return createAuthToken({ ...payload, type: 'access' }, ACCESS_TTL_SECONDS);
}

export function createRefreshTokenString(payload: { userId: string; jti: string }): string {
  return createAuthToken({ userId: payload.userId, email: '', role: 'CLIENT_OWNER', tenantId: null, type: 'refresh', jti: payload.jti }, REFRESH_TTL_SECONDS);
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const expected = crypto.createHmac('sha256', env.JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function generateAuthTokens(
  user: { userId: string; email: string; role: string; tenantId: string | null },
  deviceInfo?: string,
  ipAddress?: string,
): Promise<AuthTokens> {
  const jti = crypto.randomUUID();
  const accessToken = createAccessToken({ userId: user.userId, email: user.email, role: user.role as TokenPayload['role'], tenantId: user.tenantId, jti });
  const refreshToken = createRefreshTokenString({ userId: user.userId, jti });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, jti, expires_at, device_info, ip_address) VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.userId, tokenHash, jti, expiresAt, deviceInfo ?? null, ipAddress ?? null],
  );
  return { accessToken, refreshToken };
}

export async function verifyRefreshToken(refreshToken: string): Promise<{ userId: string; jti: string } | null> {
  const payload = verifyAuthToken(refreshToken);
  if (!payload || payload.type !== 'refresh' || !payload.jti) return null;
  const tokenHash = hashToken(refreshToken);
  const res = await pool.query(
    `SELECT id, user_id, revoked_at, expires_at FROM refresh_tokens WHERE token_hash = $1 AND jti = $2 LIMIT 1`,
    [tokenHash, payload.jti],
  );
  const row = res.rows[0];
  if (!row || row.revoked_at || new Date(row.expires_at) < new Date()) return null;
  return { userId: row.user_id, jti: row.jti };
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const payload = verifyAuthToken(refreshToken);
  if (!payload || !payload.jti) return;
  const tokenHash = hashToken(refreshToken);
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1 AND jti = $2 AND revoked_at IS NULL`,
    [tokenHash, payload.jti],
  );
}

export async function revokeAllUserRefreshTokens(userId: string, exceptJti?: string): Promise<void> {
  if (exceptJti) {
    await pool.query(
      `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND jti <> $2 AND revoked_at IS NULL`,
      [userId, exceptJti],
    );
  } else {
    await pool.query(`UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
  }
}
