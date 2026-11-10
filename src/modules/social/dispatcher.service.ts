import { sendMetaDm, publishMetaPost } from './meta.service';
import { sendWhatsAppMessage } from './whatsapp.service';
import { publishLinkedInPost } from './linkedin.service';
import { publishTweet } from './twitter.service';
import { logger } from '../../core/config/logger.config';

export interface DispatchMessageOptions {
  channel: 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'LINKEDIN' | 'TWITTER';
  recipientId: string;
  text: string;
  credentials: {
    accessToken: string;
    accountId?: string;
  };
}

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
        phoneNumberId: credentials.accountId || '',
        accessToken: credentials.accessToken,
        to: recipientId,
        text,
      });

    default:
      logger.warn({ channel }, 'Direct messaging not supported or configured for channel');
      return false;
  }
}

