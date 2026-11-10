import { logger } from '../../core/config/logger.config';

export interface SendMetaDmOptions {
  pageAccessToken: string;
  recipientId: string;
  text: string;
  platform: 'INSTAGRAM' | 'FACEBOOK';
}

export async function sendMetaDm(options: SendMetaDmOptions): Promise<boolean> {
  const { pageAccessToken, recipientId, text, platform } = options;
  const endpoint = 'https://graph.facebook.com/v19.0/me/messages';

  const payload = {
    recipient: { id: recipientId },
    message: { text },
    messaging_type: 'RESPONSE',
  };

  try {
    const res = await fetch(`${endpoint}?access_token=${encodeURIComponent(pageAccessToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error({ status: res.status, errText, platform }, 'Meta Graph API DM error');
      return false;
    }

    logger.info({ recipientId, platform }, 'Direct message dispatched successfully via Meta Graph API');
    return true;
  } catch (err: any) {
    logger.error({ err: err.message, platform }, 'Failed to dispatch Meta DM');
    return false;
  }
}

export interface ReplyToCommentOptions {
  accessToken: string;
  commentId: string;
  text: string;
  platform: 'INSTAGRAM' | 'FACEBOOK';
}

export async function replyToComment(options: ReplyToCommentOptions): Promise<boolean> {
  const { accessToken, commentId, text, platform } = options;
  const edge = platform === 'INSTAGRAM' ? 'replies' : 'comments';
  const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(commentId)}/${edge}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err, platform }, 'Failed to reply to comment');
      return false;
    }

    logger.info({ commentId, platform }, 'Comment reply dispatched successfully');
    return true;
  } catch (err: any) {
    logger.error({ err: err.message, platform }, 'Exception replying to comment');
    return false;
  }
}

export interface PublishMetaPostOptions {
  pageAccessToken: string;
  targetId: string;
  caption: string;
  imageUrl?: string;
  platform: 'INSTAGRAM' | 'FACEBOOK';
}

export async function publishMetaPost(options: PublishMetaPostOptions): Promise<{ success: boolean; postId?: string }> {
  const { pageAccessToken, targetId, caption, platform } = options;
  const url = `https://graph.facebook.com/v19.0/${targetId}/feed`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: caption, access_token: pageAccessToken }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err, platform }, 'Failed to publish post via Meta');
      return { success: false };
    }

    const data: any = await res.json();
    logger.info({ postId: data.id, platform }, 'Post successfully published on Meta');
    return { success: true, postId: data.id };
  } catch (err: any) {
    logger.error({ err: err.message, platform }, 'Exception publishing Meta post');
    return { success: false };
  }
}

