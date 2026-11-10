import { getDuePosts, markPostPublished } from './postSchedulerService';
import { dispatchSocialMessage } from '../social/dispatcher';
import { invokeAgentEngine } from '../../agents/agentWorkflow';
import { logger } from '../../config/logger';

let isRunning = false;
let cronTimer: NodeJS.Timeout | null = null;

/**
 * Ticks every 60 seconds: Checks for due posts, self-comments, and daily routines
 */
export async function checkAndExecuteDuePosts(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const duePosts = await getDuePosts();
    if (duePosts.length > 0) {
      logger.info(`⏰ Cron detected ${duePosts.length} posts due for peak-hour publishing.`);
    }

    for (const post of duePosts) {
      logger.info({ id: post.id, platform: post.platform }, '🚀 Publishing scheduled peak post...');

      const credentials = {
        accessToken: post.access_token || '',
        accountId: post.account_id || '',
      };

      // Dispatch to platform
      const success = await dispatchSocialMessage({
        channel: post.platform,
        recipientId: credentials.accountId,
        text: post.content,
        credentials,
      });

      if (success) {
        await markPostPublished(post.id, `pub_${Date.now()}`);
        logger.info({ id: post.id }, '✅ Post published successfully.');

        // Trigger Agent #1 (Self-Comment) after 60 seconds
        setTimeout(() => {
          triggerSelfComment(post.tenant_id, post.platform, post.content);
        }, 60000);
      } else {
        await markPostPublished(post.id, null, 'Dispatch returned failure');
      }
    }
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in cron due posts execution');
  } finally {
    isRunning = false;
  }
}

/**
 * Triggers Agent #1 (Self-Comment) 60 seconds after post publication
 */
async function triggerSelfComment(tenantId: string, platform: string, postContent: string) {
  try {
    const finalState = await invokeAgentEngine({
      tenantId,
      channel: platform,
      targetAgent: 'SELF_COMMENTER',
      incomingMessage: postContent,
    });
    logger.info({ comment: finalState.generatedResponse }, '💬 Agent #1 (Self-Comment) generated engagement comment');
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Self-comment generation skipped');
  }
}

/**
 * Starts the Autonomous 24/7 Clock Engine
 */
export function startAutonomousCron(): void {
  if (cronTimer) return;
  logger.info('🕒 Autonomous Social Media Schedule Clock started (1-minute tick).');
  cronTimer = setInterval(checkAndExecuteDuePosts, 60000);
}

export function stopAutonomousCron(): void {
  if (cronTimer) {
    clearInterval(cronTimer);
    cronTimer = null;
    logger.info('Autonomous Social Media Schedule Clock stopped.');
  }
}

