import { logger } from '../../core/config/logger.config';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { assertSafeOutboundUrl, getTenantOutboundAllowedDomains } from '../../core/security/egress.policy';
import { logOutboundCall } from '../agents/agent.audit';

export interface ExternalToolDefinition {
  toolName: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpointUrl: string;
  authHeaderName?: string;
  authHeaderValue?: string;
  parametersSchema?: Record<string, any>;
  sourceType?: 'OPENAPI' | 'MANUAL';
  allowedRoles?: string[];
  sideEffect?: 'READ' | 'WRITE' | 'DESTRUCTIVE';
  requiresApproval?: boolean;
  rateLimitPerMin?: number;
  timeoutMs?: number;
  allowedDomains?: string[];
}

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE']);

function normalizeToolName(name: string): string {
  return String(name || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 80);
}

function sanitizeParams(params: any): Record<string, any> {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(params).slice(0, 50)) {
    const key = String(k).slice(0, 100);
    if (typeof v === 'string') out[key] = v.slice(0, 4000);
    else if (typeof v === 'number' || typeof v === 'boolean' || v == null) out[key] = v;
    else { try { out[key] = JSON.parse(JSON.stringify(v)); } catch { out[key] = String(v).slice(0, 1000); } }
  }
  return out;
}

export async function saveExternalTool(tenantId: string, tool: ExternalToolDefinition): Promise<void> {
  const toolName = normalizeToolName(tool.toolName);
  if (!toolName) throw new Error('Invalid toolName');
  const method = String(tool.method || 'POST').toUpperCase();
  if (!ALLOWED_METHODS.has(method)) throw new Error('Method not allowed');
  const tenantDomains = await getTenantOutboundAllowedDomains(tenantId).catch(() => []);
  const toolDomains = Array.isArray(tool.allowedDomains) ? tool.allowedDomains.map(String) : [];
  const allowedDomains = toolDomains.length ? toolDomains : tenantDomains;
  const url = assertSafeOutboundUrl(tool.endpointUrl, allowedDomains.length ? allowedDomains : undefined);
  const sideEffect = (tool.sideEffect || 'WRITE').toUpperCase();
  const allowedRoles = Array.isArray(tool.allowedRoles) && tool.allowedRoles.length ? tool.allowedRoles : ['SUPERADMIN', 'CLIENT_OWNER'];

  const sql = `
    INSERT INTO tenant_external_tools
      (tenant_id, tool_name, description, method, endpoint_url, auth_header_name, auth_header_value, parameters_schema, source_type, allowed_roles, side_effect, is_destructive, requires_approval, rate_limit_per_min, timeout_ms, allowed_domains, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16::jsonb,TRUE)
    ON CONFLICT (tenant_id, tool_name)
    DO UPDATE SET description=EXCLUDED.description, method=EXCLUDED.method, endpoint_url=EXCLUDED.endpoint_url,
      auth_header_name=EXCLUDED.auth_header_name, auth_header_value=EXCLUDED.auth_header_value,
      parameters_schema=EXCLUDED.parameters_schema, source_type=EXCLUDED.source_type,
      allowed_roles=EXCLUDED.allowed_roles, side_effect=EXCLUDED.side_effect, is_destructive=EXCLUDED.is_destructive,
      requires_approval=EXCLUDED.requires_approval, rate_limit_per_min=EXCLUDED.rate_limit_per_min, timeout_ms=EXCLUDED.timeout_ms,
      allowed_domains=EXCLUDED.allowed_domains, is_active=TRUE;
  `;
  try {
    await executeTenantQuery(tenantId, sql, [
      tenantId, toolName, String(tool.description || '').slice(0, 500), method, url.toString(),
      String(tool.authHeaderName || 'Authorization').slice(0, 100), tool.authHeaderValue ? String(tool.authHeaderValue).slice(0, 2000) : null,
      JSON.stringify(tool.parametersSchema || {}), tool.sourceType || 'MANUAL', JSON.stringify(allowedRoles),
      sideEffect, sideEffect === 'DESTRUCTIVE', !!tool.requiresApproval, Math.max(1, Math.min(600, Number(tool.rateLimitPerMin) || 60)), Math.max(1000, Math.min(30000, Number(tool.timeoutMs) || 15000)), JSON.stringify(allowedDomains)
    ]);
  } catch (err: any) {
    const msg = String(err.message || '');
    if (msg.includes('allowed_domains') || msg.includes('allowed_roles') || msg.includes('side_effect')) {
      await executeTenantQuery(tenantId, `
        INSERT INTO tenant_external_tools (tenant_id, tool_name, description, method, endpoint_url, auth_header_name, auth_header_value, parameters_schema, source_type)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (tenant_id, tool_name) DO UPDATE SET description=EXCLUDED.description, method=EXCLUDED.method, endpoint_url=EXCLUDED.endpoint_url,
          auth_header_name=EXCLUDED.auth_header_name, auth_header_value=EXCLUDED.auth_header_value, parameters_schema=EXCLUDED.parameters_schema, source_type=EXCLUDED.source_type, is_active=TRUE;`,
        [tenantId, toolName, String(tool.description || '').slice(0, 500), method, url.toString(), String(tool.authHeaderName || 'Authorization').slice(0, 100), tool.authHeaderValue ? String(tool.authHeaderValue).slice(0, 2000) : null, JSON.stringify(tool.parametersSchema || {}), tool.sourceType || 'MANUAL']
      );
      return;
    }
    throw err;
  }
}

export async function listTenantExternalTools(tenantId: string): Promise<ExternalToolDefinition[]> {
  try {
    const res = await executeTenantQuery(tenantId,
      `SELECT tool_name AS "toolName", description, method, endpoint_url AS "endpointUrl",
              auth_header_name AS "authHeaderName", auth_header_value AS "authHeaderValue",
              parameters_schema AS "parametersSchema", source_type AS "sourceType"
       FROM tenant_external_tools WHERE tenant_id = $1 AND is_active = TRUE;`, [tenantId]);
    return res.rows;
  } catch (err: any) {
    logger.error({ err: err.message, tenantId }, 'Failed to list tenant external tools');
    return [];
  }
}

export async function importOpenApiSpec(tenantId: string, specUrl: string, authHeaderValue?: string): Promise<number> {
  const tenantDomains = await getTenantOutboundAllowedDomains(tenantId).catch(() => []);
  const specUrlObj = assertSafeOutboundUrl(specUrl, tenantDomains.length ? tenantDomains : undefined);
  const resp = await fetch(specUrlObj.toString(), { signal: AbortSignal.timeout(15000) });
  if (!resp.ok) throw new Error(`Failed to fetch OpenAPI spec: ${resp.statusText}`);
  const spec: any = await resp.json();
  const baseUrl = spec.servers?.[0]?.url || specUrlObj.origin;
  const paths = spec.paths || {};
  let count = 0;
  for (const [pathKey, methods] of Object.entries<any>(paths)) {
    for (const [methodKey, details] of Object.entries<any>(methods)) {
      const method = methodKey.toUpperCase();
      if (!ALLOWED_METHODS.has(method)) continue;
      const rawName = details.operationId || `${methodKey}_${pathKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const toolName = normalizeToolName(rawName).slice(0, 50);
      const description = (details.summary || details.description || `Execute ${method} on ${pathKey}`).slice(0, 500);
      const fullUrl = pathKey.startsWith('http') ? pathKey : `${String(baseUrl).replace(/\/$/, '')}/${String(pathKey).replace(/^\//, '')}`;
      let safeUrl: URL;
      try { safeUrl = assertSafeOutboundUrl(fullUrl, tenantDomains.length ? tenantDomains : undefined); } catch { continue; }
      await saveExternalTool(tenantId, {
        toolName, description, method: method as any, endpointUrl: safeUrl.toString(),
        authHeaderName: 'Authorization', authHeaderValue,
        parametersSchema: details.requestBody?.content?.['application/json']?.schema || details.parameters || {},
        sourceType: 'OPENAPI', allowedDomains: tenantDomains,
      });
      count++;
    }
  }
  return count;
}

export { executeExternalTool } from './external-tools.executor';

