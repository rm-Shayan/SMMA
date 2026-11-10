import { logger } from '../../core/config/logger.config';

export interface SendWhatsAppOptions {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}

export async function sendWhatsAppMessage(options: SendWhatsAppOptions): Promise<boolean> {
  const { phoneNumberId, accessToken, to, text } = options;
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: true, body: text },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err, to }, 'WhatsApp Cloud API send message error');
      return false;
    }

    logger.info({ to }, 'WhatsApp Cloud API: message dispatched successfully');
    return true;
  } catch (err: any) {
    logger.error({ err: err.message, to }, 'Failed to dispatch WhatsApp message');
    return false;
  }
}

