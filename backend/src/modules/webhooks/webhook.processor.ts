import { logger } from '../../core/config/logger.config';
import { invokeAgentEngine } from '../agents/agent.workflow';
import { saveCapturedLead } from '../leads/lead.service';
import { getDecryptedTenantCredential } from '../credentials/credentials.service';
import { dispatchSocialMessage } from '../social/dispatcher.service';
import { logConversation, getRecentConversationHistory, isConversationEscalated } from '../inbox/conversation.service';

export interface MetaWebhookJobData {
  platform: 'INSTAGRAM' | 'FACEBOOK';
  tenantId: string;
  senderId: string;
  messageText: string;
  messageId?: string;
}

export interface WhatsAppWebhookJobData {
  tenantId: string;
  senderPhone: string;
  senderName: string;
  messageText: string;
  phoneNumberId: string;
  messageId?: string;
}

const seenMessageIds = new Map<string, number>();
function isDuplicateMessage(tenantId: string, messageId?: string): boolean {
  if (!messageId) return false;
  const key = `${tenantId}:${messageId}`;
  const now = Date.now();
  if (seenMessageIds.has(key) && now - (seenMessageIds.get(key) || 0) < 86400000) return true;
  seenMessageIds.set(key, now);
  return false;
}

async function finalizeInbound(opts: {
  tenantId: string; platform: any; senderId: string; senderName?: string;
  messageText: string; aiResult: any; accountId?: string;
}) {
  const { tenantId, platform, senderId, senderName, messageText, aiResult, accountId } = opts;
  await logConversation({
    tenantId, platform, senderId, incomingText: messageText,
    intentCategory: aiResult.intent, agentResponse: aiResult.generatedResponse,
    isEscalated: aiResult.requiresHumanReview,
  });
  if (aiResult.generatedResponse) {
    const creds = await getDecryptedTenantCredential(tenantId, platform.toLowerCase());
    if (creds?.accessToken) {
      await dispatchSocialMessage({
        channel: platform, recipientId: senderId, text: aiResult.generatedResponse,
        credentials: { accessToken: creds.accessToken, accountId: creds.accountId || accountId },
      });
    }
  }
  if (aiResult.crmContactUpdates?.phone || aiResult.crmContactUpdates?.email || (platform === 'WHATSAPP' && senderId)) {
    await saveCapturedLead({
      tenantId, channel: platform,
      name: aiResult.crmContactUpdates?.name || senderName,
      phone: aiResult.crmContactUpdates?.phone || (platform === 'WHATSAPP' ? senderId : undefined),
      email: aiResult.crmContactUpdates?.email, inquiryInterest: messageText,
      leadScore: aiResult.leadScore,
    });
  }
}

export async function processMetaWebhookJob(data: MetaWebhookJobData): Promise<void> {
  const { tenantId, platform, senderId, messageText, messageId } = data;
  if (isDuplicateMessage(tenantId, messageId)) {
    logger.info({ tenantId, messageId }, 'Duplicate Meta webhook dropped');
    return;
  }
  try {
    if (await isConversationEscalated(tenantId, platform, senderId)) {
      await logConversation({ tenantId, platform, senderId, incomingText: messageText, agentResponse: null, isEscalated: true });
      return;
    }
    const conversationHistory = await getRecentConversationHistory(tenantId, platform, senderId);
    const aiResult = await invokeAgentEngine({
      tenantId, channel: platform, incomingMessage: messageText, senderId, conversationHistory, targetAgent: 'DM_HANDLER',
    });
    await finalizeInbound({ tenantId, platform, senderId, messageText, aiResult });
  } catch (err: any) {
    logger.error({ err: err.message, tenantId, platform }, 'Error processing Meta webhook');
  }
}

export async function processWhatsAppWebhookJob(data: WhatsAppWebhookJobData): Promise<void> {
  const { tenantId, senderPhone, senderName, messageText, phoneNumberId, messageId } = data;
  if (isDuplicateMessage(tenantId, messageId)) {
    logger.info({ tenantId, messageId }, 'Duplicate WhatsApp webhook dropped');
    return;
  }
  const platform = 'WHATSAPP';
  try {
    if (await isConversationEscalated(tenantId, platform, senderPhone)) {
      await logConversation({ tenantId, platform, senderId: senderPhone, incomingText: messageText, agentResponse: null, isEscalated: true });
      return;
    }
    const conversationHistory = await getRecentConversationHistory(tenantId, platform, senderPhone);
    const aiResult = await invokeAgentEngine({
      tenantId, channel: platform, incomingMessage: messageText, senderId: senderPhone, conversationHistory, targetAgent: 'DM_HANDLER',
    });
    await finalizeInbound({ tenantId, platform, senderId: senderPhone, senderName, messageText, aiResult, accountId: phoneNumberId });
  } catch (err: any) {
    logger.error({ err: err.message, tenantId }, 'Error processing WhatsApp webhook');
  }
}
