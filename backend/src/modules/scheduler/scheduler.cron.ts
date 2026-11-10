import { claimDuePosts, markPostPublished, markPostFailed } from './scheduler.service';
import { logger } from '../../core/config/logger.config';
import { publishLinkedInPost } from '../social/linkedin.service';
import { publishTweet } from '../social/twitter.service';
import { publishMetaPost } from '../social/meta.service';
import { getDecryptedTenantCredential } from '../credentials/credentials.service';
import { enqueueDelayedSelfComment } from './queue.service';
import { runTokenHealthAudit } from '../credentials/token-monitor.service';
import { runAutonomousCadenceTick } from './cadence.service';

let cronInterval: NodeJS.Timeout | null = null;
let isTickRunning = false;
let tickCount = 0;

export async function processDuePostsTick(): Promise<void> {
  if (isTickRunning) return;
  isTickRunning = true;
  tickCount++;

  try {
    if (tickCount % 60 === 1) {
      await runTokenHealthAudit().catch((e) => logger.debug({ err: e.message }, 'Token audit error'));
    }

    if (tickCount % 5 === 1) {
      await runAutonomousCadenceTick().catch((e) => logger.debug({ err: e.message }, 'Cadence tick error'));
    }

    const duePosts = await claimDuePosts();
    if (duePosts.length === 0) return;

    logger.info({ count: duePosts.length }, 'Processing due scheduled posts');

    for (const post of duePosts) {
      try {
        const creds = await getDecryptedTenantCredential(post.tenant_id, String(post.platform).toLowerCase());
        if (!creds?.accessToken) {
          await markPostFailed(post.id, 'No valid credentials configured for platform');
          logger.warn({ postId: post.id, platform: post.platform }, 'Skipping post: missing credentials');
          continue;
        }

        const token = creds.accessToken;
        const accountId = creds.accountId;
        let published = false;
        let failureReason = `Unsupported platform: ${post.platform}`;

        switch (String(post.platform).toLowerCase()) {
          case 'linkedin': {
            const res = await publishLinkedInPost({ accessToken: token, authorUrn: accountId || 'me', text: post.content });
            published = res.success;
            failureReason = 'LinkedIn publish failed';
            break;
          }
          case 'twitter': {
            const res = await publishTweet({ bearerTokenOrOAuth: token, text: post.content });
            published = res.success;
            failureReason = 'X/Twitter publish failed';
            break;
          }
          case 'instagram':
          case 'facebook': {
            const res = await publishMetaPost({
              pageAccessToken: token,
              targetId: accountId || 'me',
              caption: post.content,
              platform: String(post.platform).toUpperCase() as 'INSTAGRAM' | 'FACEBOOK',
            });
            published = res.success;
            failureReason = `${post.platform} publish failed`;
            break;
          }
        }

        if (!published) {
          await markPostFailed(post.id, failureReason);
          logger.error({ postId: post.id, platform: post.platform }, 'Post publishing failed');
          continue;
        }

        await markPostPublished(post.id);

        await enqueueDelayedSelfComment({
          tenantId: post.tenant_id,
          channel: String(post.platform).toUpperCase(),
          content: post.content,
          postId: post.id,
        });
      } catch (err: any) {
        await markPostFailed(post.id, err.message || 'Unexpected publishing error');
        logger.error({ err: err.message, postId: post.id }, 'Error publishing post');
      }
    }
  } finally {
    isTickRunning = false;
  }
}

export function startAutonomousCron(): void {
  if (cronInterval) return;
  logger.info('Starting Autonomous Scheduler Clock (60-second tick)');
  cronInterval = setInterval(processDuePostsTick, 60000);
}

export function stopAutonomousCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    logger.info('Autonomous Scheduler Clock stopped');
  }
}
