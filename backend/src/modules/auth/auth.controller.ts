import { Request, Response } from 'express';
import { pool } from '../../core/database/pool.database';
import { hashPassword, loginUser, registerUser, generateAuthTokens, verifyRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens } from './auth.service';
import { LoginSchema, CreateUserSchema, RegisterSchema, RefreshSchema, LogoutSchema } from './auth.schemas';
import { logger } from '../../core/config/logger.config';

export * from './auth.recovery.controller';

export async function handleLogin(req: Request, res: Response): Promise<void> {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation Error', details: parsed.error.format() }); return; }
  const result = await loginUser(parsed.data.email, parsed.data.password, { deviceInfo: parsed.data.deviceInfo, ipAddress: req.ip });
  if (!result) { res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials or unverified email' }); return; }
  res.status(200).json({ success: true, token: result.token, refreshToken: result.refreshToken, user: result.user });
}

export async function handleCreateUser(req: Request, res: Response): Promise<void> {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation Error', details: parsed.error.format() }); return; }
  const { email, password, fullName, role, tenantId } = parsed.data;
  const isSuper = req.user?.role === 'SUPERADMIN';
  if (!isSuper && role === 'SUPERADMIN') { res.status(403).json({ error: 'Forbidden', message: 'Only SUPERADMIN can create SUPERADMIN users' }); return; }
  const assignedTenantId = isSuper ? (tenantId || null) : req.tenantId;
  if (role !== 'SUPERADMIN' && !assignedTenantId) { res.status(400).json({ error: 'Validation Error', message: 'tenantId is required' }); return; }

  const sql = `INSERT INTO platform_users (tenant_id, email, password_hash, role, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, email, role, full_name, created_at;`;
  try {
    const dbRes = await pool.query(sql, [assignedTenantId, email.toLowerCase().trim(), hashPassword(password), role ?? 'CLIENT_OWNER', fullName]);
    logger.info({ email, role }, '👤 New Platform User created');
    res.status(201).json({ success: true, user: dbRes.rows[0] });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to create platform user');
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}

export async function handleRegister(req: Request, res: Response): Promise<void> {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation Error', details: parsed.error.format() }); return; }
  try {
    const result = await registerUser(parsed.data);
    res.status(201).json({ success: true, message: 'User registered. Please verify email.', user: result.user, emailVerificationRequired: result.emailVerificationRequired });
  } catch (err: any) {
    if (err.message === 'EMAIL_ALREADY_REGISTERED') { res.status(409).json({ error: 'Conflict', message: 'Email already registered' }); return; }
    if (err.message === 'TENANT_ID_REQUIRED') { res.status(400).json({ error: 'Validation Error', message: 'tenantId is required' }); return; }
    logger.error({ err: err.message }, 'Registration failed');
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}

export async function handleRefresh(req: Request, res: Response): Promise<void> {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation Error', details: parsed.error.format() }); return; }
  const validated = await verifyRefreshToken(parsed.data.refreshToken);
  if (!validated) { res.status(401).json({ error: 'Unauthorized', message: 'Invalid or revoked refresh token' }); return; }

  const userRes = await pool.query(`SELECT id, email, role, tenant_id FROM platform_users WHERE id = $1 AND is_active = TRUE LIMIT 1`, [validated.userId]);
  const user = userRes.rows[0];
  if (!user) { res.status(401).json({ error: 'Unauthorized', message: 'User not found or inactive' }); return; }

  await revokeRefreshToken(parsed.data.refreshToken);
  const tokens = await generateAuthTokens({ userId: user.id, email: user.email, role: user.role, tenantId: user.tenant_id }, undefined, req.ip);
  res.status(200).json({ success: true, token: tokens.accessToken, refreshToken: tokens.refreshToken });
}

export async function handleLogout(req: Request, res: Response): Promise<void> {
  const parsed = LogoutSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Validation Error', details: parsed.error.format() }); return; }
  if (parsed.data.refreshToken) await revokeRefreshToken(parsed.data.refreshToken);
  else if (req.user) await revokeAllUserRefreshTokens(req.user.userId);
  res.status(200).json({ success: true, message: 'Logged out' });
}

export async function handleLogoutAll(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  await revokeAllUserRefreshTokens(req.user.userId);
  res.status(200).json({ success: true, message: 'All sessions logged out' });
}

export async function handleGetMe(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  res.status(200).json({ success: true, user: req.user });
}
