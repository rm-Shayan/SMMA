import { logger } from '../../core/config/logger.config';

export interface LinkedInPostOptions {
  accessToken: string;
  authorUrn: string;
  text: string;
}

export async function publishLinkedInPost(options: LinkedInPostOptions): Promise<{ success: boolean; postId?: string }> {
  const { accessToken, authorUrn, text } = options;
  const url = 'https://api.linkedin.com/v2/ugcPosts';

  const payload = {
    author: authorUrn.startsWith('urn:li:') ? authorUrn : `urn:li:person:${authorUrn}`,
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
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err }, 'LinkedIn v2 API publishing error');
      return { success: false };
    }

    const data: any = await res.json();
    logger.info({ id: data.id }, 'Post successfully published on LinkedIn');
    return { success: true, postId: data.id };
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to publish LinkedIn post');
    return { success: false };
  }
}

