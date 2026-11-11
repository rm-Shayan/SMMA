export type ActorRole = 'SUPERADMIN' | 'CLIENT_OWNER' | 'AGENT_OPERATOR' | 'TRAINEE';

export interface ActorContext {
  userId?: string;
  role: ActorRole;
  tenantId: string;
}

export const TOOL_CAPABILITIES: Record<string, ActorRole[]> = {
  PUBLISH_POST: ['SUPERADMIN', 'CLIENT_OWNER'],
  SCHEDULE_CALENDAR: ['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR'],
  CREATE_SHEET: ['SUPERADMIN', 'CLIENT_OWNER'],
  SEND_EMAIL_ALERT: ['SUPERADMIN', 'CLIENT_OWNER'],
  QUERY_DATA: ['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR'],
  EXTERNAL_ACTION: ['SUPERADMIN', 'CLIENT_OWNER'],
  NONE: ['SUPERADMIN', 'CLIENT_OWNER', 'AGENT_OPERATOR', 'TRAINEE'],
};

export const ALLOWED_TOOLS = new Set(Object.keys(TOOL_CAPABILITIES));
const ALLOWED_PLATFORMS = new Set(['INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'LINKEDIN', 'TWITTER', 'EMAIL']);
const ALLOWED_QUERY_ENTITIES = new Set(['LEADS', 'POSTS', 'CONVERSATIONS', 'ACCOUNT_INFO', 'HEALTH', 'SYSTEM']);

export function normalizeTool(tool: any): string {
  const t = String(tool || 'NONE').toUpperCase().trim();
  return ALLOWED_TOOLS.has(t) ? t : 'NONE';
}

export function safeStr(v: any, max = 2000): string {
  return String(v ?? '').slice(0, max);
}

export function validateParams(tool: string, raw: any): { ok: true; params: any } | { ok: false; reason: string } {
  const p = raw && typeof raw === 'object' ? raw : {};
  switch (tool) {
    case 'PUBLISH_POST': {
      const platform = String(p.platform || 'INSTAGRAM').toUpperCase();
      if (!ALLOWED_PLATFORMS.has(platform)) return { ok: false, reason: `Platform not allowed: ${platform}` };
      const postContent = safeStr(p.postContent, 4000);
      if (!postContent.trim()) return { ok: false, reason: 'postContent is required' };
      return { ok: true, params: { platform, postContent } };
    }
    case 'SCHEDULE_CALENDAR': {
      const meetingTitle = safeStr(p.meetingTitle || 'Strategy Session', 200);
      const attendeeEmail = safeStr(p.attendeeEmail || '', 320);
      if (attendeeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) return { ok: false, reason: 'Invalid attendeeEmail' };
      const startTimeIso = safeStr(p.startTimeIso || '', 64);
      const start = startTimeIso && !Number.isNaN(Date.parse(startTimeIso))
        ? new Date(startTimeIso).toISOString()
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      return { ok: true, params: { meetingTitle, attendeeEmail, startTimeIso: start, duration: 30 } };
    }
    case 'CREATE_SHEET': {
      const sheetTitle = safeStr(p.sheetTitle || 'Tracker', 120);
      const headers = Array.isArray(p.sheetHeaders) && p.sheetHeaders.length
        ? p.sheetHeaders.slice(0, 20).map((h: any) => safeStr(h, 60) || 'Column')
        : ['Date', 'Item', 'Status'];
      return { ok: true, params: { sheetTitle, headers } };
    }
    case 'SEND_EMAIL_ALERT': {
      const toEmail = safeStr(p.toEmail || p.attendeeEmail || '', 320);
      if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) return { ok: false, reason: 'Valid toEmail required' };
      return { ok: true, params: { toEmail, subject: safeStr(p.subject || 'Executive Alert', 200), bodyText: safeStr(p.bodyText || '', 4000) } };
    }
    case 'QUERY_DATA': {
      const entityRaw = String(p.entity || 'LEADS').toUpperCase();
      return { ok: true, params: { entity: ALLOWED_QUERY_ENTITIES.has(entityRaw) ? entityRaw : 'LEADS' } };
    }
    case 'EXTERNAL_ACTION': {
      const externalToolName = safeStr(p.externalToolName || '', 80).toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (!externalToolName) return { ok: false, reason: 'externalToolName required' };
      return { ok: true, params: { externalToolName, externalParams: p.externalParams || {} } };
    }
    case 'NONE':
      return { ok: true, params: {} };
    default:
      return { ok: false, reason: 'Unknown tool' };
  }
}

