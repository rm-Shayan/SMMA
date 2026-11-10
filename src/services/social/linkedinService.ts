import { logger } from '../../config/logger';

export interface LinkedInPublishOptions {
  accessToken: string;
  authorUrn: string; // e.g. "urn:li:organization:123456" or "urn:li:person:abcdef"
  text: string;
}

/**
 * Direct HTTP Service for LinkedIn Developer API v2
 */
export async function publishLinkedInPost(options: LinkedInPublishOptions): Promise<string | null> {
  const { accessToken, authorUrn, text } = options;
  const endpoint = 'https://api.linkedin.com/v2/ugcPosts';

  const payload = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err }, 'LinkedIn post publishing failed');
      return null;
    }

    const data: any = await res.json();
    logger.info({ id: data.id }, '✅ LinkedIn post published successfully');
    return data.id || null;
  } catch (error: any) {
    logger.error({ error: error.message }, 'LinkedIn network exception');
    return null;
  }
}

