import dns from 'dns/promises';
import { logger } from '../../core/config/logger.config';
import { executeTenantQuery } from '../../core/database/tenant-query.database';

export const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE']);

export function normalizeToolName(name: string): string {
  return String(name || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 80);
}

export function isPrivateOrLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase().trim();
  if (!h || ['localhost', '::1', '0.0.0.0', 'host.docker.internal'].includes(h)) return true;
  if (h.endsWith('.local') || h.endsWith('.internal')) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b, c, d] = m.slice(1).map(Number);
    if ([a, b, c, d].some((n) => n < 0 || n > 255)) return true;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (h.includes(':') && (h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80'))) return true;
  return false;
}

export function assertAllowedEgressUrl(rawUrl: string): URL {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new Error('Invalid endpoint URL'); }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only HTTP/HTTPS endpoints are allowed');
  if (url.username || url.password) throw new Error('Credentials in URL are not allowed');
  if (isPrivateOrLocalHost(url.hostname)) throw new Error('Local/private network endpoints are not allowed');
  return url;
}

export async function assertAllowedEgressUrlAsync(rawUrl: string): Promise<URL> {
  const url = assertAllowedEgressUrl(rawUrl);
  try {
    const lookup = await dns.lookup(url.hostname);
    if (isPrivateOrLocalHost(lookup.address)) {
      throw new Error(`Egress destination resolves to private/internal IP address (${lookup.address})`);
    }
  } catch (err: any) {
    if (err.message?.includes('private/internal IP')) throw err;
  }
  return url;
}

export function sanitizeParams(params: any): Record<string, any> {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(params).slice(0, 50)) {
    const key = String(k).slice(0, 100);
    if (typeof v === 'string') out[key] = v.slice(0, 4000);
    else if (typeof v === 'number' || typeof v === 'boolean' || v == null) out[key] = v;
    else out[key] = JSON.parse(JSON.stringify(v).slice(0, 8000));
  }
  return out;
}

export async function logOutbound(opts: {
  tenantId: string; actorUserId?: string | null; actorRole?: string | null; toolName: string; method: string;
  url: URL; decision: 'ALLOW' | 'DENY' | 'NEEDS_APPROVAL'; decisionReason?: string; status?: string; statusCode?: number | null;
  latencyMs?: number | null; error?: string | null;
}) {
  try {
    await executeTenantQuery(opts.tenantId, `INSERT INTO outbound_call_logs
      (tenant_id, actor_user_id, actor_role, tool_name, method, destination_host, destination_path_redacted, decision, decision_reason, status, status_code, latency_ms, error_redacted)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [
      opts.tenantId, opts.actorUserId || null, opts.actorRole || null, opts.toolName, opts.method,
      opts.url.hostname, opts.url.pathname || '/', opts.decision, opts.decisionReason || null, opts.status || null,
      opts.statusCode ?? null, opts.latencyMs ?? null, opts.error ? String(opts.error).slice(0, 500) : null,
    ]);
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Failed to write outbound call log');
  }
}

