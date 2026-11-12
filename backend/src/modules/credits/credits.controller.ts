import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getTenantCreditSummary,
  listTenantEmployeesWithCredits,
  distributeCreditsToEmployee,
  allocateCreditsToTenant,
} from './credits.service';
import { logger } from '../../core/config/logger.config';
import { logAiOperation } from '../agents/agent.audit';

const DistributeSchema = z.object({
  employeeId: z.string().uuid(),
  amount: z.number().int().min(0).max(1_000_000),
});

const AllocateTenantSchema = z.object({
  tenantId: z.string().uuid(),
  totalCredits: z.number().int().min(0).max(10_000_000),
});

export async function handleGetCreditSummary(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const isSuper = req.user.role === 'SUPERADMIN';
  const rawId = isSuper ? (req.query.tenantId || req.params.tenantId || req.user.tenantId) : (req.user.tenantId || req.tenantId);
  const targetTenantId = String(Array.isArray(rawId) ? rawId[0] : rawId || '');

  if (!targetTenantId) {
    res.status(400).json({ error: 'Validation Error', message: 'Tenant ID required' });
    return;
  }

  try {
    const summary = await getTenantCreditSummary(targetTenantId);
    res.status(200).json({ success: true, credits: summary });
  } catch (err: any) {
    logger.error({ err: err.message, targetTenantId }, 'Failed to get credit summary');
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}

export async function handleListEmployeesCredits(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const isSuper = req.user.role === 'SUPERADMIN';
  const rawId = isSuper ? (req.query.tenantId || req.params.tenantId || req.user.tenantId) : (req.user.tenantId || req.tenantId);
  const targetTenantId = String(Array.isArray(rawId) ? rawId[0] : rawId || '');

  if (!targetTenantId) {
    res.status(400).json({ error: 'Validation Error', message: 'Tenant ID required' });
    return;
  }

  try {
    const employees = await listTenantEmployeesWithCredits(targetTenantId);
    res.status(200).json({ success: true, count: employees.length, employees });
  } catch (err: any) {
    logger.error({ err: err.message, targetTenantId }, 'Failed to list employee credits');
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}

export async function handleDistributeCredits(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const parsed = DistributeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }

  const isSuper = req.user.role === 'SUPERADMIN';
  const targetTenantId = String(isSuper ? (req.body.tenantId || req.user.tenantId || '') : (req.user.tenantId || req.tenantId || ''));

  if (!targetTenantId) {
    res.status(400).json({ error: 'Validation Error', message: 'Tenant context required' });
    return;
  }

  try {
    await distributeCreditsToEmployee(targetTenantId, parsed.data.employeeId, parsed.data.amount);
    await logAiOperation({
      tenantId: targetTenantId,
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      intent: 'distribute_agent_credits',
      proposedTool: 'CREDIT_MANAGER',
      proposedParams: parsed.data,
      decision: 'ALLOW',
      executedTool: 'distribute_credits',
      resultStatus: 'SUCCESS',
    });
    res.status(200).json({ success: true, message: `Successfully allocated ${parsed.data.amount} credits to employee` });
  } catch (err: any) {
    if (err.message.startsWith('INSUFFICIENT_CREDITS')) {
      res.status(400).json({ error: 'Insufficient Credits', message: err.message });
      return;
    }
    logger.error({ err: err.message }, 'Failed to distribute credits');
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}

export async function handleAllocateTenantCredits(req: Request, res: Response): Promise<void> {
  if (!req.user || req.user.role !== 'SUPERADMIN') {
    res.status(403).json({ error: 'Forbidden', message: 'Only SUPERADMIN can allocate company plan credits' });
    return;
  }

  const parsed = AllocateTenantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }

  try {
    await allocateCreditsToTenant(parsed.data.tenantId, parsed.data.totalCredits);
    res.status(200).json({ success: true, message: `Successfully allocated ${parsed.data.totalCredits} plan credits to tenant` });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to allocate plan credits to tenant');
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}

