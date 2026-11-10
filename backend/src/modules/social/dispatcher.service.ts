import { sendMetaDm } from './meta.service';
import { sendWhatsAppMessage } from './whatsapp.service';
import { logger } from '../../core/config/logger.config';
import { logOutboundCall } from '../agents/agent.audit';

export interface DispatchMessageOptions {
  channel: 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'LINKEDIN' | 'TWITTER';
  recipientId: string;
  text: string;
  credentials: {
    accessToken: string;
    accountId?: string;
  };
  audit?: { tenantId: string; actorUserId?: string; actorRole?: string; intent?: string };
}

export async function dispatchSocialMessage(options: DispatchMessageOptions): Promise<boolean> {
  const { channel, recipientId, text, credentials, audit } = options;
  const destHost = channel === 'WHATSAPP' ? 'graph.facebook.com' : 'graph.facebook.com';
  const started = Date.now();
  let ok = false;
  let errMsg: string | undefined;
  try {
    switch (channel) {
      case 'INSTAGRAM':
      case 'FACEBOOK':
        ok = await sendMetaDm({ pageAccessToken: credentials.accessToken, recipientId, text, platform: channel });
        break;
      case 'WHATSAPP':
        ok = await sendWhatsAppMessage({ phoneNumberId: credentials.accountId || '', accessToken: credentials.accessToken, to: recipientId, text });
        break;
      default:
        errMsg = `Direct messaging not supported for channel ${channel}`;
        logger.warn({ channel }, errMsg);
        ok = false;
    }
  } catch (e: any) {
    errMsg = e?.message || 'Dispatch exception';
    ok = false;
  }
  if (audit?.tenantId) {
    await logOutboundCall({
      tenantId: audit.tenantId,
      actorUserId: audit.actorUserId || null,
      actorRole: audit.actorRole || null,
      toolName: `social_${String(channel).toLowerCase()}_message`,
      method: 'POST',
      destinationHost: destHost,
      destinationPath: '/v19.0/messages',
      decision: 'ALLOW',
      decisionReason: audit.intent || 'Authorized outbound dispatch',
      status: ok ? 'SUCCESS' : 'FAILED',
      latencyMs: Date.now() - started,
      error: errMsg || (ok ? null : 'Dispatch failed'),
    });
  }
  return ok;
}

