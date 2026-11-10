import { logger } from '../../config/logger';

export interface MetaSendDmOptions {
  pageAccessToken: string;
  recipientId: string;
  text: string;
  platform: 'INSTAGRAM' | 'FACEBOOK';
}

export interface MetaPublishPostOptions {
  pageAccessToken: string;
  pageId: string;
  caption: string;
  imageUrl?: string;
}

/**
 * Direct HTTP Service for Meta Graph API (Instagram & Facebook)
 */
export async function sendMetaDm(options: MetaSendDmOptions): Promise<boolean> {
  const { pageAccessToken, recipientId, text, platform } = options;
  const endpoint = platform === 'INSTAGRAM'
    ? 'https://graph.facebook.com/v21.0/me/messages'
    : 'https://graph.facebook.com/v21.0/me/messages';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pageAccessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ platform, status: res.status, err }, 'Meta DM dispatch failed');
      return false;
    }

    logger.info({ platform, recipientId }, '✅ Meta DM sent successfully');
    return true;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Meta DM network exception');
    return false;
  }
}

/**
 * Publish a Feed Post to Facebook Page or Instagram Business
 */
export async function publishMetaPost(options: MetaPublishPostOptions): Promise<string | null> {
  const { pageAccessToken, pageId, caption, imageUrl } = options;
  const endpoint = `https://graph.facebook.com/v21.0/${pageId}/feed`;

  try {
    const payload: any = { message: caption };
    if (imageUrl) payload.link = imageUrl;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pageAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err }, 'Meta post publication failed');
      return null;
    }

    const data: any = await res.json();
    return data.id || null;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Meta post network exception');
    return null;
  }
}

