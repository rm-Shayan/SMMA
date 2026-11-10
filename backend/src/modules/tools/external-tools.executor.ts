import { executeTenantQuery } from '../../core/database/tenant-query.database';
import {
  ALLOWED_METHODS,
  normalizeToolName,
  assertAllowedEgressUrlAsync,
  sanitizeParams,
  logOutbound,
} from './external-tools.egress';

export async function executeExternalTool(
  tenantId: string,
  toolName: string,
  params: Record<string, any> = {},
  actor?: { userId?: string; role?: string }
): Promise<any> {
  const name = normalizeToolName(toolName);
  const res = await executeTenantQuery(
    tenantId,
    `SELECT tool_name, method, endpoint_url, auth_header_name, auth_header_value, allowed_roles, is_destructive, requires_approval FROM tenant_external_tools WHERE tenant_id = $1 AND tool_name = $2 AND is_active = TRUE;`,
    [tenantId, name]
  );
  const tool = res.rows[0];
  if (!tool) throw new Error(`External tool "${name}" not found for this tenant.`);

  if (tool.allowed_roles) {
    const rawRoles = tool.allowed_roles;
    const allowed = Array.isArray(rawRoles) ? rawRoles : (typeof rawRoles === 'string' ? JSON.parse(rawRoles) : ['SUPERADMIN', 'CLIENT_OWNER']);
    if (!actor?.role || !allowed.includes(actor.role)) {
      const err = new Error(`Access Denied: Role "${actor?.role || 'ANONYMOUS'}" is not permitted to execute tool "${name}". Allowed: [${allowed.join(', ')}]`);
      await logOutbound({ tenantId, actorUserId: actor?.userId, actorRole: actor?.role, toolName: name, method: tool.method, url: new URL('https://denied.invalid/'), decision: 'DENY', decisionReason: err.message, status: 'DENIED' });
      throw err;
    }
  }

  if (tool.requires_approval && actor?.role !== 'SUPERADMIN' && actor?.role !== 'CLIENT_OWNER') {
    const err = new Error(`Approval Required: Tool "${name}" requires owner approval before execution.`);
    await logOutbound({ tenantId, actorUserId: actor?.userId, actorRole: actor?.role, toolName: name, method: tool.method, url: new URL('https://approval.invalid/'), decision: 'NEEDS_APPROVAL', decisionReason: err.message, status: 'PENDING_APPROVAL' });
    throw err;
  }

  const url = await assertAllowedEgressUrlAsync(tool.endpoint_url);
  const method = String(tool.method || 'POST').toUpperCase();
  if (!ALLOWED_METHODS.has(method)) throw new Error('Tool method not allowed');
  const safeParams = sanitizeParams(params);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tool.auth_header_value) headers[String(tool.auth_header_name || 'Authorization')] = String(tool.auth_header_value);

  const init: RequestInit = { method, headers, signal: AbortSignal.timeout(15000) };
  if (method === 'GET') {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(safeParams)) {
      if (v != null) q.set(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
    const qs = q.toString();
    if (qs) url.search = qs;
  } else {
    init.body = JSON.stringify(safeParams);
  }

  const started = Date.now();
  try {
    const callRes = await fetch(url.toString(), init);
    const text = await callRes.text();
    const latencyMs = Date.now() - started;
    let data: any;
    try { data = JSON.parse(text); } catch { data = { rawResponse: text.slice(0, 4000), status: callRes.status }; }
    await logOutbound({ tenantId, actorUserId: actor?.userId, actorRole: actor?.role, toolName: name, method, url, decision: 'ALLOW', decisionReason: 'Egress checks passed', status: callRes.ok ? 'SUCCESS' : 'FAILED', statusCode: callRes.status, latencyMs });
    if (!callRes.ok) throw new Error(`External call failed with status ${callRes.status}`);
    return data;
  } catch (err: any) {
    await logOutbound({ tenantId, actorUserId: actor?.userId, actorRole: actor?.role, toolName: name, method, url, decision: 'ALLOW', decisionReason: 'Attempted after checks', status: 'FAILED', latencyMs: Date.now() - started, error: err.message });
    throw err;
  }
}

