import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../../core/database/pool.database';
import { hashPassword, loginUser } from './auth.service';
import { logger } from '../../core/config/logger.config';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR']),
  tenantId: z.string().uuid().optional(),
});

export async function handleLogin(req: Request, res: Response): Promise<void> {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }
  const result = await loginUser(parsed.data.email, parsed.data.password);
  if (!result) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
    return;
  }
  res.status(200).json({ success: true, token: result.token, user: result.user });
}

export async function handleCreateUser(req: Request, res: Response): Promise<void> {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }

  const { email, password, fullName, role, tenantId } = parsed.data;
  const isSuper = req.user?.role === 'SUPERADMIN';

  if (!isSuper && role === 'SUPERADMIN') {
    res.status(403).json({ error: 'Forbidden', message: 'Only SUPERADMIN can create SUPERADMIN users' });
    return;
  }

  const assignedTenantId = isSuper ? (tenantId || null) : req.tenantId;
  if (role !== 'SUPERADMIN' && !assignedTenantId) {
    res.status(400).json({ error: 'Validation Error', message: 'tenantId is required for tenant users' });
    return;
  }

  const sql = `
    INSERT INTO platform_users (tenant_id, email, password_hash, role, full_name)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, tenant_id, email, role, full_name, created_at;
  `;

  try {
    const dbRes = await pool.query(sql, [
      assignedTenantId,
      email.toLowerCase().trim(),
      hashPassword(password),
      role,
      fullName,
    ]);
    logger.info({ email, role }, '👤 New Platform User created');
    res.status(201).json({ success: true, user: dbRes.rows[0] });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to create platform user');
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}

export async function handleGetMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.status(200).json({ success: true, user: req.user });
}

