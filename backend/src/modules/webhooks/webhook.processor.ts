import { logger } from '../../core/config/logger.config';
import { invokeAgentEngine } from '../agents/agent.workflow';
import { saveCapturedLead } from '../leads/lead.service';
import { findTenantByPlatformAccount, getDecryptedTenantCredential } from '../credentials/credentials.service';
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

export async function processMetaWebhookJob(data: MetaWebhookJobData): Promise<void> {
  const { tenantId, platform, senderId, messageText } = data;
  try {
    const escalated = await isConversationEscalated(tenantId, platform, senderId);
    if (escalated) {
      await logConversation({ tenantId, platform, senderId, incomingText: messageText, agentResponse: null, isEscalated: true });
      return;
    }

    const conversationHistory = await getRecentConversationHistory(tenantId, platform, senderId);
    const aiResult = await invokeAgentEngine({
      tenantId,
      channel: platform,
      incomingMessage: messageText,
      senderId,
      conversationHistory,
      targetAgent: 'DM_HANDLER',
    });

    await logConversation({
      tenantId,
      platform,
      senderId,
      incomingText: messageText,
      intentCategory: aiResult.intent,
      agentResponse: aiResult.generatedResponse,
      isEscalated: aiResult.requiresHumanReview,
    });

    if (aiResult.generatedResponse) {
      const creds = await getDecryptedTenantCredential(tenantId, platform.toLowerCase());
      if (creds?.accessToken) {
        await dispatchSocialMessage({
          channel: platform,
          recipientId: senderId,
          text: aiResult.generatedResponse,
          credentials: { accessToken: creds.accessToken, accountId: creds.accountId },
        });
      }
    }

    if (aiResult.crmContactUpdates?.phone || aiResult.crmContactUpdates?.email) {
      await saveCapturedLead({
        tenantId,
        channel: platform,
        name: aiResult.crmContactUpdates.name,
        phone: aiResult.crmContactUpdates.phone,
        email: aiResult.crmContactUpdates.email,
        inquiryInterest: messageText,
        leadScore: aiResult.leadScore,
      });
    }
  } catch (err: any) {
    logger.error({ err: err.message, tenantId, platform }, 'Error processing Meta webhook job');
  }
}

export async function processWhatsAppWebhookJob(data: WhatsAppWebhookJobData): Promise<void> {
  const { tenantId, senderPhone, senderName, messageText, phoneNumberId } = data;
  const platform = 'WHATSAPP';
  try {
    const aiResult = await invokeAgentEngine({
      tenantId,
      channel: platform,
      incomingMessage: messageText,
      senderId: senderPhone,
      targetAgent: 'DM_HANDLER',
    });

    await logConversation({
      tenantId,
      platform,
      senderId: senderPhone,
      incomingText: messageText,
      intentCategory: aiResult.intent,
      agentResponse: aiResult.generatedResponse,
      isEscalated: aiResult.requiresHumanReview,
    });

    if (aiResult.generatedResponse) {
      const creds = await getDecryptedTenantCredential(tenantId, 'whatsapp');
      if (creds?.accessToken) {
        await dispatchSocialMessage({
          channel: platform,
          recipientId: senderPhone,
          text: aiResult.generatedResponse,
          credentials: { accessToken: creds.accessToken, accountId: creds.accountId || phoneNumberId },
        });
      }
    }

    if (aiResult.crmContactUpdates?.phone || aiResult.crmContactUpdates?.email || senderPhone) {
      await saveCapturedLead({
        tenantId,
        channel: platform,
        name: aiResult.crmContactUpdates?.name || senderName,
        phone: aiResult.crmContactUpdates?.phone || senderPhone,
        email: aiResult.crmContactUpdates?.email,
        inquiryInterest: messageText,
        leadScore: aiResult.leadScore,
      });
    }
  } catch (err: any) {
    logger.error({ err: err.message, tenantId }, 'Error processing WhatsApp webhook job');
  }
}

