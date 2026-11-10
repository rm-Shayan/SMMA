import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { logger } from '../../core/config/logger.config';

export function isPrivateOrLocalHost(hostname: string): boolean {
  const h = String(hostname || '').toLowerCase().trim();
  if (!h) return true;
  if (['localhost', '::1', '0.0.0.0', 'host.docker.internal'].includes(h)) return true;
  if (h.endsWith('.local') || h.endsWith('.internal')) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a,b] = m.slice(1,3).map(Number);
    const parts = m.slice(1).map(Number);
    if (parts.some(n => n < 0 || n > 255)) return true;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  if (h.includes(':') && (h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80'))) return true;
  return false;
}

export function assertSafeOutboundUrl(rawUrl: string, allowedDomains?: string[]): URL {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new Error('Invalid URL'); }
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Only HTTP/HTTPS allowed');
  if (url.username || url.password) throw new Error('URL credentials not allowed');
  if (isPrivateOrLocalHost(url.hostname)) throw new Error('Private/local endpoints not allowed');
  const host = url.hostname.toLowerCase();
  if (Array.isArray(allowedDomains) && allowedDomains.length > 0) {
    const ok = allowedDomains.some(d => {
      const dom = String(d || '').toLowerCase().trim();
      return dom && (host === dom || host.endsWith('.' + dom));
    });
    if (!ok) throw new Error(`Domain not in tenant allowlist: ${host}`);
  }
  return url;
}

export async function getTenantOutboundAllowedDomains(tenantId: string): Promise<string[]> {
  try {
    const res = await executeTenantQuery(tenantId, `SELECT outbound_allowed_domains FROM tenants WHERE id = $1`, [tenantId]);
    const raw = res.rows[0]?.outbound_allowed_domains;
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === 'string') { try { const p = JSON.parse(raw); return Array.isArray(p) ? p.map(String) : []; } catch { return []; } }
    return [];
  } catch (err: any) {
    logger.warn({ err: err.message, tenantId }, 'Failed to read tenant outbound domain allowlist');
    return [];
  }
}

export async function checkAndConsumeRateLimit(tenantId: string, actorUserId: string | undefined, toolName: string, limitPerMin = 30): Promise<{ ok: boolean; reason?: string }> {
  try {
    const windowStart = new Date();
    windowStart.setSeconds(0, 0);
    const res = await executeTenantQuery(tenantId, `
      INSERT INTO ai_rate_limits (tenant_id, actor_user_id, tool_name, window_start, count)
      VALUES ($1,$2,$3,$4,1)
      ON CONFLICT (tenant_id, actor_user_id, tool_name, window_start)
      DO UPDATE SET count = ai_rate_limits.count + 1
      RETURNING count;
    `, [tenantId, actorUserId || null, toolName, windowStart.toISOString()]);
    const count = Number(res.rows[0]?.count || 0);
    if (count > limitPerMin) return { ok: false, reason: `Rate limit exceeded for ${toolName}` };
    return { ok: true };
  } catch (err: any) {
    // fail-open for missing migration/table to avoid breaking runtime, but log
    logger.warn({ err: err.message, tenantId, toolName }, 'Rate limit check failed; allowing');
    return { ok: true };
  }
}

export async function reserveIdempotency(tenantId: string, actorUserId: string | undefined, toolName: string, idempotencyKey: string | undefined, proposedParams: any): Promise<{ ok: boolean; existingId?: string }> {
  const key = String(idempotencyKey || '').trim().slice(0, 120);
  if (!key) return { ok: true };
  try {
    const existing = await executeTenantQuery(tenantId, `SELECT id, status FROM ai_action_approvals WHERE tenant_id=$1 AND idempotency_key=$2 LIMIT 1`, [tenantId, key]);
    if (existing.rows[0]) return { ok: false, existingId: existing.rows[0].id };
    return { ok: true };
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Idempotency reserve failed; allowing');
    return { ok: true };
  }
}
