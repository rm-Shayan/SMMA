import { sendMetaDm, publishMetaPost } from './metaService';
import { sendWhatsAppMessage } from './whatsappService';
import { publishLinkedInPost } from './linkedinService';
import { publishTweet } from './twitterService';
import { logger } from '../../config/logger';

export interface DispatchMessageOptions {
  channel: 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'LINKEDIN' | 'TWITTER';
  recipientId: string;
  text: string;
  credentials: {
    accessToken: string;
    accountId?: string;
  };
}

/**
 * Universal Outgoing Dispatcher across all 5 supported platforms
 */
export async function dispatchSocialMessage(options: DispatchMessageOptions): Promise<boolean> {
  const { channel, recipientId, text, credentials } = options;

  switch (channel) {
    case 'INSTAGRAM':
    case 'FACEBOOK':
      return sendMetaDm({
        pageAccessToken: credentials.accessToken,
        recipientId,
        text,
        platform: channel,
      });

    case 'WHATSAPP':
      return sendWhatsAppMessage({
        accessToken: credentials.accessToken,
        phoneNumberId: credentials.accountId || '',
        recipientPhone: recipientId,
        text,
      });

    case 'TWITTER':
      return publishTweet({
        bearerOrUserToken: credentials.accessToken,
        text,
      }).then((id) => id !== null);

    case 'LINKEDIN':
      return publishLinkedInPost({
        accessToken: credentials.accessToken,
        authorUrn: credentials.accountId || '',
        text,
      }).then((id) => id !== null);

    default:
      logger.warn({ channel }, 'Unsupported channel for direct social dispatch');
      return false;
  }
}

