import crypto from 'crypto';
import { pool } from '../../core/database/pool.database';
import { env } from '../../core/config/env.config';
import { logger } from '../../core/config/logger.config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'SUPERADMIN' | 'CLIENT_OWNER' | 'AGENT_OPERATOR' | 'TRAINEE';
  tenantId: string | null;
}

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

export function createAuthToken(payload: TokenPayload, expiresInSeconds = 86400 * 7): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', env.JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
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

export async function loginUser(email: string, pass: string): Promise<{ token: string; user: any } | null> {
  const sql = `SELECT id, tenant_id, email, password_hash, role, full_name, is_active FROM platform_users WHERE email = $1 LIMIT 1;`;
  try {
    const res = await pool.query(sql, [email.toLowerCase().trim()]);
    const user = res.rows[0];
    if (!user || !user.is_active || !verifyPassword(pass, user.password_hash)) {
      return null;
    }
    const token = createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
    });
    return { token, user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id, name: user.full_name } };
  } catch (err: any) {
    logger.error({ err: err.message }, 'User login query failed');
    return null;
  }
}

