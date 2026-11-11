import { pool } from '../../core/database/pool.database';
import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { logger } from '../../core/config/logger.config';
import { assertAllowedEgressUrlAsync, logOutbound } from './external-tools.egress';
import { sendLeadAlertEmail } from '../integrations/smtp-email.service';

export async function queryExternalSystemHealth(tenantId: string): Promise<string> {
  const sql = `
    SELECT tool_name, destination_host,
           COUNT(*) as total_calls,
           COUNT(*) FILTER (WHERE status = 'SUCCESS') as success_calls,
           COUNT(*) FILTER (WHERE status = 'FAILED') as failed_calls,
           ROUND(AVG(latency_ms)) as avg_latency_ms,
           MAX(created_at) as last_checked_at
    FROM outbound_call_logs
    WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
    GROUP BY tool_name, destination_host
    ORDER BY total_calls DESC
    LIMIT 10;
  `;
  try {
    const res = await executeTenantQuery(tenantId, sql, [tenantId]);
    if (!res.rows.length) {
      return `### 🩺 System & API Health Monitor (Last 24 Hours)\nNo external API activity logged yet in the last 24 hours. Registered tools are standby.`;
    }

    const rows = res.rows.map((r) => {
      const total = Number(r.total_calls) || 1;
      const succ = Number(r.success_calls) || 0;
      const uptime = Math.round((succ / total) * 100);
      const icon = uptime >= 95 ? '🟢 Live' : uptime >= 75 ? '🟡 Degraded' : '🔴 Down';
      return `| \`${r.tool_name}\` | ${r.destination_host} | ${icon} (${uptime}%) | \`${r.avg_latency_ms || 0} ms\` | ${r.total_calls} |`;
    });

    return `### 🩺 External System & API Health Monitor\n| Tool Name | Host | Health Status | Avg Latency | 24h Calls |\n| --- | --- | --- | --- | --- |\n${rows.join('\n')}`;
  } catch (err: any) {
    logger.error({ err: err.message, tenantId }, 'Failed to query system health');
    return `### ⚠️ Health Query Failed\nCould not fetch monitoring stats: ${err.message}`;
  }
}

export async function runExternalSystemHealthAudit(): Promise<void> {
  const query = `
    SELECT t.id as tool_id, t.tenant_id, t.tool_name, t.endpoint_url, t.auth_header_name, t.auth_header_value,
           c.company_name, c.notification_email
    FROM tenant_external_tools t
    JOIN tenants c ON c.id = t.tenant_id
    WHERE t.is_active = TRUE AND c.is_active = TRUE
    LIMIT 20;
  `;
  try {
    const res = await pool.query(query);
    if (!res.rows.length) return;

    for (const tool of res.rows) {
      const started = Date.now();
      let safeUrl: URL;
      try {
        safeUrl = await assertAllowedEgressUrlAsync(tool.endpoint_url);
      } catch {
        continue;
      }

      const headers: Record<string, string> = {};
      if (tool.auth_header_value) headers[tool.auth_header_name || 'Authorization'] = tool.auth_header_value;

      try {
        const ping = await fetch(safeUrl.toString(), {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(8000),
        });
        const latencyMs = Date.now() - started;
        const isOk = ping.status < 500;

        await logOutbound({
          tenantId: tool.tenant_id,
          toolName: tool.tool_name,
          method: 'GET',
          url: safeUrl,
          decision: 'ALLOW',
          decisionReason: 'Autonomous Health Ping',
          status: isOk ? 'SUCCESS' : 'FAILED',
          statusCode: ping.status,
          latencyMs,
        });

        if (!isOk && tool.notification_email) {
          await sendLeadAlertEmail({
            toEmail: tool.notification_email,
            companyName: tool.company_name,
            leadName: `System Alert: Endpoint Down (${tool.tool_name})`,
            leadPhone: 'N/A',
            leadEmail: tool.notification_email,
            channel: 'HEALTH_WATCHDOG',
            interest: `External API ${tool.tool_name} returned HTTP ${ping.status} during autonomous health check. Latency: ${latencyMs}ms.`,
            leadScore: 100,
            googleSheetUrl: 'https://agency.portal/settings/integrations',
          }).catch(() => {});
        }
      } catch (pingErr: any) {
        const latencyMs = Date.now() - started;
        await logOutbound({
          tenantId: tool.tenant_id,
          toolName: tool.tool_name,
          method: 'GET',
          url: safeUrl,
          decision: 'ALLOW',
          decisionReason: 'Autonomous Health Ping Exception',
          status: 'FAILED',
          latencyMs,
          error: pingErr.message,
        });
      }
    }
  } catch (err: any) {
    logger.debug({ err: err.message }, 'Health watchdog audit sweep completed with notices');
  }
}
