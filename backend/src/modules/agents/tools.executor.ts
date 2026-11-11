import { executeTenantQuery } from '../../core/database/tenant-query.database';
import { logger } from '../../core/config/logger.config';
import { createGoogleCalendarEvent } from '../integrations/google-calendar.service';
import { createGoogleSpreadsheet } from '../integrations/google-sheets-creator.service';
import { sendLeadAlertEmail } from '../integrations/smtp-email.service';
import { executeExternalTool } from '../tools/external-tools.service';
import { queryExternalSystemHealth } from '../tools/external-watchdog.service';

export interface ToolResult {
  success: boolean;
  action: string;
  data?: any;
  message: string;
}

export async function executeToolPublishPost(tenantId: string, platform: string, content: string, delayMinutes = 0): Promise<ToolResult> {
  const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
  const sql = `
    INSERT INTO scheduled_posts (tenant_id, platform, content, scheduled_at, status)
    VALUES ($1, $2, $3, $4, 'PENDING')
    RETURNING id, platform, scheduled_at, status;
  `;
  try {
    const res = await executeTenantQuery(tenantId, sql, [tenantId, platform.toUpperCase(), content, scheduledAt]);
    logger.info({ tenantId, platform, postId: res.rows[0].id }, 'Tool: Post queued for publishing');
    return {
      success: true,
      action: 'publish_post',
      data: res.rows[0],
      message: `Post successfully queued to publish on ${platform.toUpperCase()} at ${scheduledAt.toISOString()}.`,
    };
  } catch (err: any) {
    return { success: false, action: 'publish_post', message: err.message };
  }
}

export async function executeToolScheduleCalendar(tenantId: string, title: string, attendeeEmail: string, startTimeIso: string, duration = 30): Promise<ToolResult> {
  try {
    const res = await createGoogleCalendarEvent({
      summary: title,
      attendeeEmail,
      startTimeIso,
      durationMinutes: duration,
    });
    return {
      success: true,
      action: 'schedule_meeting',
      data: res,
      message: `Calendar event "${title}" booked with ${attendeeEmail || 'client'}! Meet Link: ${res?.meetLink || 'Google Meet attached'}`,
    };
  } catch (err: any) {
    return { success: false, action: 'schedule_meeting', message: err.message };
  }
}

export async function executeToolCreateSheet(tenantId: string, title: string, headers: string[], sampleRows: any[][] = []): Promise<ToolResult> {
  try {
    const res = await createGoogleSpreadsheet(title, headers, sampleRows);
    return {
      success: true,
      action: 'create_sheet',
      data: res,
      message: `Google Sheet "${title}" created! Columns: [${headers.join(', ')}]. Link: ${res?.spreadsheetUrl || 'Generated'}`,
    };
  } catch (err: any) {
    return { success: false, action: 'create_sheet', message: err.message };
  }
}

export async function executeToolSendEmailAlert(toEmail: string, companyName: string, subject: string, bodyText: string): Promise<ToolResult> {
  try {
    await sendLeadAlertEmail({
      toEmail,
      companyName,
      leadName: subject,
      leadPhone: 'N/A',
      leadEmail: toEmail,
      channel: 'DIRECT_EXECUTIVE_ALERT',
      interest: bodyText,
      leadScore: 100,
      googleSheetUrl: 'https://docs.google.com/spreadsheets',
    });
    return {
      success: true,
      action: 'send_email',
      message: `Email alert successfully sent to ${toEmail}.`,
    };
  } catch (err: any) {
    return { success: false, action: 'send_email', message: err.message };
  }
}

export async function executeToolQueryData(tenantId: string, entity: string, limit = 5): Promise<ToolResult> {
  try {
    const e = (entity || '').toUpperCase();
    let tableName = 'Leads Data';
    let sql = `SELECT name, email, phone, channel, lead_score, created_at FROM leads WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`;

    if (e.includes('HEALTH') || e.includes('SYSTEM') || e.includes('API') || e.includes('MONITOR')) {
      const msg = await queryExternalSystemHealth(tenantId);
      return { success: true, action: 'query_health', message: msg };
    } else if (e.includes('POST') || e.includes('SCHEDULE')) {
      tableName = 'Scheduled Posts';
      sql = `SELECT platform, status, scheduled_at, LEFT(content, 30) AS preview FROM scheduled_posts WHERE tenant_id = $1 ORDER BY scheduled_at DESC LIMIT $2`;
    } else if (e.includes('CONVERSATION') || e.includes('CHAT') || e.includes('INBOX')) {
      tableName = 'Customer Inquiries & Conversations';
      sql = `SELECT platform, sender_id, is_escalated, LEFT(incoming_text, 30) AS message, created_at FROM tenant_conversations WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`;
    } else if (e.includes('ACCOUNT') || e.includes('COMPANY') || e.includes('PLAN')) {
      const res = await executeTenantQuery(tenantId, `SELECT company_name, current_plan, is_active, autonomous_mode_enabled FROM tenants WHERE id = $1`, [tenantId]);
      return {
        success: true, action: 'query_account', data: res.rows[0],
        message: `Company: ${res.rows[0]?.company_name}\nPlan: ${res.rows[0]?.current_plan}\nAutonomous AI: ${res.rows[0]?.autonomous_mode_enabled ? 'Active' : 'Paused'}\nStatus: ${res.rows[0]?.is_active ? 'Active' : 'Suspended'}`,
      };
    }

    const res = await executeTenantQuery(tenantId, sql, [tenantId, limit]);
    if (!res.rows.length) return { success: true, action: 'query_data', data: [], message: `No data found in ${tableName} for this company.` };
    const headers = Object.keys(res.rows[0]);
    const tableMd = `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n` + res.rows.map(r => `| ${headers.map(h => String(r[h] ?? '-')).join(' | ')} |`).join('\n');
    return { success: true, action: 'query_data', data: res.rows, message: `### ${tableName} (Latest ${res.rows.length} rows)\n${tableMd}` };
  } catch (err: any) {
    return { success: false, action: 'query_data', message: err.message };
  }
}

export async function executeToolExternalAction(tenantId: string, toolName: string, params: Record<string, any> = {}, actor?: { userId?: string; role?: string }): Promise<ToolResult> {
  try {
    const data = await executeExternalTool(tenantId, toolName, params, actor);
    return {
      success: true,
      action: toolName,
      data,
      message: `External tool "${toolName}" executed successfully.`,
    };
  } catch (err: any) {
    return { success: false, action: toolName, message: err.message };
  }
}


