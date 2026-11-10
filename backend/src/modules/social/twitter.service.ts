import { logger } from '../../core/config/logger.config';

export interface TweetOptions {
  bearerTokenOrOAuth: string;
  text: string;
}

export async function publishTweet(options: TweetOptions): Promise<{ success: boolean; tweetId?: string }> {
  const { bearerTokenOrOAuth, text } = options;
  const url = 'https://api.twitter.com/2/tweets';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearerTokenOrOAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err }, 'X (Twitter) API v2 publishing error');
      return { success: false };
    }

    const data: any = await res.json();
    logger.info({ tweetId: data.data?.id }, 'Tweet successfully published on X (Twitter)');
    return { success: true, tweetId: data.data?.id };
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to publish tweet');
    return { success: false };
  }
}

