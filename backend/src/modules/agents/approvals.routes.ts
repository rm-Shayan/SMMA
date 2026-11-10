import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/rbac.middleware';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { logAiOperation } from '../agents/agent.audit';
import { authorizeAndExecuteProposedTool } from '../agents/agent.policy';

export const approvalsRouter = Router();
approvalsRouter.use(requireAuth);

approvalsRouter.get('/', requireRole(['SUPERADMIN', 'CLIENT_OWNER']), async (req, res) => {
  const tenantId = req.user?.role === 'SUPERADMIN' ? (typeof req.query.tenantId === 'string' ? req.query.tenantId : req.user.tenantId) : (req.user?.tenantId || req.tenantId);
  if (!tenantId) { res.status(403).json({ error: 'Tenant context required' }); return; }
  try {
    const rows = await executeTenantQuery(tenantId, `SELECT id, tool_name, proposed_params, status, decision_reason, created_at, approved_at, executed_at, idempotency_key FROM ai_action_approvals WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 100`, [tenantId]);
    res.json({ success: true, approvals: rows.rows });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

approvalsRouter.post('/:id/approve', requireRole(['SUPERADMIN', 'CLIENT_OWNER']), async (req, res) => {
  const tenantId = req.user?.role === 'SUPERADMIN' ? (req.body?.tenantId || req.user.tenantId) : (req.user?.tenantId || req.tenantId);
  if (!tenantId || !req.user) { res.status(403).json({ error: 'Tenant context required' }); return; }
  const id = String(req.params.id || '');
  try {
    const found = await executeTenantQuery(tenantId, `SELECT * FROM ai_action_approvals WHERE id=$1 AND tenant_id=$2`, [id, tenantId]);
    const item = found.rows[0];
    if (!item) { res.status(404).json({ error: 'Approval not found' }); return; }
    if (item.status !== 'PENDING') { res.status(400).json({ error: `Approval is ${item.status}` }); return; }
    await executeTenantQuery(tenantId, `UPDATE ai_action_approvals SET status='APPROVED', approved_by=$2, approved_at=NOW() WHERE id=$1 AND tenant_id=$3`, [id, req.user.userId, tenantId]);
    const decision = await authorizeAndExecuteProposedTool(
      { tenantId, channel: 'SYSTEM', incomingMessage: 'Approved action execution', actor: { userId: req.user.userId, role: req.user.role, tenantId } } as any,
      { tool: item.tool_name, params: item.proposed_params || {}, summary: 'Approved execution' }
    );
    const execStatus = decision.denied || !decision.result?.success ? 'FAILED' : 'EXECUTED';
    await executeTenantQuery(tenantId, `UPDATE ai_action_approvals SET status=$2, executed_at=NOW(), execution_result=$3 WHERE id=$1 AND tenant_id=$4`, [id, execStatus, JSON.stringify({ result: decision.result, reason: decision.reason, summary: decision.summary }), tenantId]);
    await logAiOperation({ tenantId, actorUserId: req.user.userId, actorRole: req.user.role, intent: 'approve_ai_action', proposedTool: item.tool_name, proposedParams: item.proposed_params, decision: 'ALLOW', executedTool: item.tool_name, resultStatus: execStatus === 'EXECUTED' ? 'SUCCESS' : 'FAILED', resultMessage: decision.summary });
    res.json({ success: execStatus === 'EXECUTED', status: execStatus, result: decision.result, reason: decision.reason });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

approvalsRouter.post('/:id/reject', requireRole(['SUPERADMIN', 'CLIENT_OWNER']), async (req, res) => {
  const tenantId = req.user?.role === 'SUPERADMIN' ? (req.body?.tenantId || req.user.tenantId) : (req.user?.tenantId || req.tenantId);
  if (!tenantId || !req.user) { res.status(403).json({ error: 'Tenant context required' }); return; }
  const id = String(req.params.id || '');
  const reason = String(req.body?.reason || 'Rejected by owner').slice(0, 500);
  try {
    const r = await executeTenantQuery(tenantId, `UPDATE ai_action_approvals SET status='REJECTED', decision_reason=$2, approved_by=$3, approved_at=NOW() WHERE id=$1 AND tenant_id=$4 AND status='PENDING' RETURNING id`, [id, reason, req.user.userId, tenantId]);
    if (!r.rows[0]) { res.status(404).json({ error: 'Pending approval not found' }); return; }
    await logAiOperation({ tenantId, actorUserId: req.user.userId, actorRole: req.user.role, intent: 'reject_ai_action', proposedTool: 'APPROVAL', proposedParams: { id }, decision: 'DENY', decisionReason: reason, resultStatus: 'SKIPPED' });
    res.json({ success: true, status: 'REJECTED' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
