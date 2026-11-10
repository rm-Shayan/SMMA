import { logger } from '../../config/logger';

export interface TwitterTweetOptions {
  bearerOrUserToken: string;
  text: string;
  replyToTweetId?: string;
}

/**
 * Direct HTTP Service for X (Twitter) API v2
 */
export async function publishTweet(options: TwitterTweetOptions): Promise<string | null> {
  const { bearerOrUserToken, text, replyToTweetId } = options;
  const endpoint = 'https://api.twitter.com/2/tweets';

  const payload: any = { text };
  if (replyToTweetId) {
    payload.reply = { in_reply_to_tweet_id: replyToTweetId };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerOrUserToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err }, 'X (Twitter) tweet publish failed');
      return null;
    }

    const data: any = await res.json();
    logger.info({ id: data.data?.id }, '✅ Tweet published successfully on X');
    return data.data?.id || null;
  } catch (error: any) {
    logger.error({ error: error.message }, 'X (Twitter) network exception');
    return null;
  }
}

