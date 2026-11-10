import { getDuePosts, markPostPublished } from './scheduler.service';
import { logger } from '../../core/config/logger.config';
import { publishLinkedInPost } from '../social/linkedin.service';
import { publishTweet } from '../social/twitter.service';
import { publishMetaPost } from '../social/meta.service';
import { invokeAgentEngine } from '../agents/agent.workflow';

let cronInterval: NodeJS.Timeout | null = null;

export async function processDuePostsTick(): Promise<void> {
  const duePosts = await getDuePosts();
  if (duePosts.length === 0) return;

  logger.info({ count: duePosts.length }, '⏰ Processing due scheduled posts');

  for (const post of duePosts) {
    try {
      let published = false;
      const token = post.access_token || 'mock_token';

      switch (post.platform) {
        case 'linkedin':
          const liRes = await publishLinkedInPost({ accessToken: token, authorUrn: post.account_id || 'me', text: post.content });
          published = liRes.success;
          break;
        case 'twitter':
          const twRes = await publishTweet({ bearerTokenOrOAuth: token, text: post.content });
          published = twRes.success;
          break;
        case 'instagram':
        case 'facebook':
          const fbRes = await publishMetaPost({ pageAccessToken: token, targetId: post.account_id || 'me', caption: post.content, platform: post.platform.toUpperCase() as any });
          published = fbRes.success;
          break;
      }

      await markPostPublished(post.id);

      // Trigger Agent #1 (Self-Comment Agent) 60s post-publication
      setTimeout(async () => {
        try {
          await invokeAgentEngine({
            tenantId: post.tenant_id,
            channel: post.platform.toUpperCase() as any,
            incomingMessage: post.content,
            targetAgent: 'SELF_COMMENTER',
          });
          logger.info({ postId: post.id }, '💬 Agent #1 boosted reach with delayed first comment');
        } catch (e: any) {
          logger.error({ err: e.message }, 'Failed to execute delayed self-comment');
        }
      }, 60000);
    } catch (err: any) {
      logger.error({ err: err.message, postId: post.id }, 'Error publishing post');
    }
  }
}

export function startAutonomousCron(): void {
  if (cronInterval) return;
  logger.info('🚀 Starting Autonomous Scheduler Clock (60-second tick)');
  cronInterval = setInterval(processDuePostsTick, 60000);
}

export function stopAutonomousCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    logger.info('🛑 Autonomous Scheduler Clock stopped');
  }
}
