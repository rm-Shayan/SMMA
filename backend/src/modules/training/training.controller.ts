import { Request, Response } from 'express';
import { z } from 'zod';
import { saveCompanyTrainingDoc } from './training.service';
import { invokeAgentEngine } from '../agents/agent.workflow';
import { logger } from '../../core/config/logger.config';
import { executeTenantQuery } from '../../core/database/tenant-query.database';

const UploadDocSchema = z.object({
  title: z.string().min(2),
  category: z.enum(['SOP', 'SALES_SCRIPT', 'PRODUCT_MANUAL', 'ONBOARDING']).default('SOP'),
  documentContent: z.string().min(20),
  keyTakeaways: z.array(z.string()).optional(),
});

function resolveTrainingTenant(req: Request): string | null {
  if (req.user?.role === 'SUPERADMIN') return (req.body?.tenantId || req.tenantId || req.user.tenantId || null) as string | null;
  return (req.user?.tenantId || req.tenantId || null) as string | null;
}

export async function handleUploadDoc(req: Request, res: Response): Promise<void> {
  const tenantId = resolveTrainingTenant(req);
  if (!tenantId || !req.user) {
    res.status(403).json({ error: 'Tenant context required' });
    return;
  }
  const parsed = UploadDocSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }
  try {
    const doc = await saveCompanyTrainingDoc({ tenantId, ...parsed.data });
    res.status(201).json({ success: true, doc });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleTrainIntern(req: Request, res: Response): Promise<void> {
  const tenantId = resolveTrainingTenant(req);
  if (!tenantId || !req.user) {
    res.status(403).json({ error: 'Tenant context required' });
    return;
  }
  const { question, internName, internEmail } = req.body;
  if (!question) {
    res.status(400).json({ error: 'Question or scenario text required' });
    return;
  }
  try {
    const aiResult = await invokeAgentEngine({
      tenantId,
      channel: 'INTERNAL_TRAINING',
      incomingMessage: question,
      senderId: internName || 'Trainee',
      targetAgent: 'INTERN_TRAINER',
      actor: { userId: req.user.userId, role: req.user.role, tenantId },
    });
    res.status(200).json({
      success: true,
      internName: internName || 'Trainee',
      response: aiResult.generatedResponse,
      trace: aiResult.executionTrace,
    });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Intern training error');
    res.status(500).json({ error: 'Training mentor failed' });
  }
}

export async function handleListSessions(req: Request, res: Response): Promise<void> {
  const tenantId = req.user?.role === 'SUPERADMIN' ? (typeof req.query.tenantId === 'string' ? req.query.tenantId : req.tenantId || req.user.tenantId) : (req.user?.tenantId || req.tenantId);
  if (!tenantId || !req.user) {
    res.status(403).json({ error: 'Tenant context required' });
    return;
  }
  try {
    const rows = await executeTenantQuery(tenantId, `SELECT * FROM intern_training_sessions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20;`, [tenantId]);
    res.status(200).json({ success: true, count: rows.rows.length, sessions: rows.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
