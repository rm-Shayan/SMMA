import { Request, Response } from 'express';
import { z } from 'zod';
import { saveCompanyTrainingDoc } from './training.service';
import { invokeAgentEngine } from '../agents/agent.workflow';
import { logger } from '../../core/config/logger.config';
import { pool } from '../../core/database/pool.database';

const UploadDocSchema = z.object({
  title: z.string().min(2),
  category: z.enum(['SOP', 'SALES_SCRIPT', 'PRODUCT_MANUAL', 'ONBOARDING']).default('SOP'),
  documentContent: z.string().min(20),
  keyTakeaways: z.array(z.string()).optional(),
});

export async function handleUploadDoc(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required' });
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
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required' });
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
  const tenantId = req.tenantId;
  const sql = `SELECT * FROM intern_training_sessions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20;`;
  try {
    const rows = await pool.query(sql, [tenantId]);
    res.status(200).json({ success: true, count: rows.rows.length, sessions: rows.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

