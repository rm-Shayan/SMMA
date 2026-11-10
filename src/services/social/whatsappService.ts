import { logger } from '../../config/logger';

export interface WhatsAppSendOptions {
  accessToken: string;
  phoneNumberId: string;
  recipientPhone: string;
  text: string;
}

/**
 * Direct HTTP Service for Meta WhatsApp Business Cloud API
 * Uses official 1,000 free 24-hour service conversations per month.
 */
export async function sendWhatsAppMessage(options: WhatsAppSendOptions): Promise<boolean> {
  const { accessToken, phoneNumberId, recipientPhone, text } = options;
  const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  // Clean phone number (remove spaces, dashes, leading plus)
  const cleanPhone = recipientPhone.replace(/[\s\-\+]/g, '');

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err, cleanPhone }, 'WhatsApp Cloud message dispatch failed');
      return false;
    }

    logger.info({ cleanPhone }, '✅ WhatsApp message dispatched successfully');
    return true;
  } catch (error: any) {
    logger.error({ error: error.message }, 'WhatsApp Cloud network exception');
    return false;
  }
}

