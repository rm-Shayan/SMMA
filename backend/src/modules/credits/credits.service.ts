import { pool } from '../../core/database/pool.database';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { logger } from '../../core/config/logger.config';

export interface CreditSummary {
  tenantId: string;
  companyName: string;
  allocatedCredits: number;
  usedCredits: number;
  remainingCredits: number;
  percentUsed: number;
  percentRemaining: number;
  isAt50Percent: boolean;
  isAt80Percent: boolean;
  alertLevel: 'NORMAL' | 'ALERT_50' | 'ALERT_80' | 'EXHAUSTED';
  alertMessage: string | null;
  employeeAllocatedTotal: number;
  unassignedCredits: number;
}

export interface EmployeeCreditDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  allocatedCredits: number;
  usedCredits: number;
  remainingCredits: number;
}

export async function getTenantCreditSummary(tenantId: string): Promise<CreditSummary> {
  const tRes = await executeTenantQuery(
    tenantId,
    `SELECT id, company_name, allocated_credits, used_credits FROM tenants WHERE id = $1;`,
    [tenantId]
  );
  const tenant = tRes.rows[0];
  if (!tenant) throw new Error('TENANT_NOT_FOUND');

  const empRes = await executeTenantQuery(
    tenantId,
    `SELECT COALESCE(SUM(allocated_credits), 0) as total_allocated FROM platform_users WHERE tenant_id = $1;`,
    [tenantId]
  );
  const employeeAllocatedTotal = parseInt(empRes.rows[0]?.total_allocated || '0', 10);

  const allocated = Math.max(0, tenant.allocated_credits || 1000);
  const used = Math.max(0, tenant.used_credits || 0);
  const remaining = Math.max(0, allocated - used);
  const percentUsed = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 100;
  const percentRemaining = Math.max(0, 100 - percentUsed);

  let alertLevel: 'NORMAL' | 'ALERT_50' | 'ALERT_80' | 'EXHAUSTED' = 'NORMAL';
  let alertMessage: string | null = null;

  if (remaining === 0) {
    alertLevel = 'EXHAUSTED';
    alertMessage = 'Credits Exhausted: All company credits have been consumed. Upgrade plan to continue.';
  } else if (percentUsed >= 80 || percentRemaining <= 20) {
    alertLevel = 'ALERT_80';
    alertMessage = `Critical Alert: 80% credit threshold reached! Only ${remaining} of ${allocated} credits remaining (${percentRemaining}% left).`;
  } else if (percentUsed >= 50 || percentRemaining <= 50) {
    alertLevel = 'ALERT_50';
    alertMessage = `Warning: 50% credit threshold reached. ${remaining} of ${allocated} credits remaining.`;
  }

  const unassignedCredits = Math.max(0, remaining - employeeAllocatedTotal);

  return {
    tenantId,
    companyName: tenant.company_name,
    allocatedCredits: allocated,
    usedCredits: used,
    remainingCredits: remaining,
    percentUsed,
    percentRemaining,
    isAt50Percent: percentUsed >= 50,
    isAt80Percent: percentUsed >= 80,
    alertLevel,
    alertMessage,
    employeeAllocatedTotal,
    unassignedCredits,
  };
}

export async function listTenantEmployeesWithCredits(tenantId: string): Promise<EmployeeCreditDto[]> {
  const res = await executeTenantQuery(
    tenantId,
    `SELECT id, full_name, email, role, is_active, allocated_credits, used_credits FROM platform_users WHERE tenant_id = $1 ORDER BY created_at ASC;`,
    [tenantId]
  );
  return res.rows.map((r: any) => ({
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    role: r.role,
    isActive: Boolean(r.is_active),
    allocatedCredits: parseInt(r.allocated_credits || '0', 10),
    usedCredits: parseInt(r.used_credits || '0', 10),
    remainingCredits: Math.max(0, parseInt(r.allocated_credits || '0', 10) - parseInt(r.used_credits || '0', 10)),
  }));
}

export async function distributeCreditsToEmployee(tenantId: string, employeeId: string, amount: number): Promise<void> {
  const summary = await getTenantCreditSummary(tenantId);
  const empRes = await executeTenantQuery(
    tenantId,
    `SELECT id, allocated_credits FROM platform_users WHERE id = $1 AND tenant_id = $2;`,
    [employeeId, tenantId]
  );
  if (!empRes.rows[0]) throw new Error('EMPLOYEE_NOT_FOUND');

  const currentEmpAlloc = parseInt(empRes.rows[0].allocated_credits || '0', 10);
  const diff = amount - currentEmpAlloc;

  if (diff > summary.unassignedCredits) {
    throw new Error(`INSUFFICIENT_CREDITS: Requested ${diff} additional credits exceeds company available unassigned pool of ${summary.unassignedCredits}`);
  }

  await executeTenantQuery(
    tenantId,
    `UPDATE platform_users SET allocated_credits = $1 WHERE id = $2 AND tenant_id = $3;`,
    [amount, employeeId, tenantId]
  );

  await executeTenantQuery(
    tenantId,
    `INSERT INTO tenant_credit_transactions (tenant_id, user_id, amount, transaction_type, description, tenant_remaining_credits)
     VALUES ($1, $2, $3, 'EMPLOYEE_DISTRIBUTION', $4, $5);`,
    [tenantId, employeeId, amount, `Allocated ${amount} agent credits to employee ${employeeId}`, summary.remainingCredits]
  );
  logger.info({ tenantId, employeeId, amount }, 'Distributed credits to employee');
}

export async function allocateCreditsToTenant(tenantId: string, totalCredits: number): Promise<void> {
  await pool.query(
    `UPDATE tenants SET allocated_credits = $1 WHERE id = $2;`,
    [totalCredits, tenantId]
  );
  await pool.query(
    `INSERT INTO tenant_credit_transactions (tenant_id, amount, transaction_type, description, tenant_remaining_credits)
     VALUES ($1, $2, 'SUPERADMIN_ALLOCATION', $3, $4);`,
    [tenantId, totalCredits, `SuperAdmin allocated ${totalCredits} plan credits to company`, totalCredits]
  );
  logger.info({ tenantId, totalCredits }, 'SuperAdmin allocated credits to company');
}

