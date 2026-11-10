import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../core/config/env.config';
import { logger } from '../../core/config/logger.config';
import { processMetaWebhookJob, processWhatsAppWebhookJob, MetaWebhookJobData, WhatsAppWebhookJobData } from '../webhooks/webhook.processor';
import { invokeAgentEngine } from '../agents/agent.workflow';

let redisClient: IORedis | null = null;
let isRedisConnected = false;

function getRedisConnection(): IORedis {
  if (!redisClient) {
    redisClient = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableReadyCheck: false,
      retryStrategy(times) {
        return Math.min(times * 500, 5000);
      },
    });
    redisClient.on('connect', () => {
      isRedisConnected = true;
      logger.info('BullMQ Redis connection established');
    });
    redisClient.on('error', (err) => {
      isRedisConnected = false;
      logger.debug({ err: err.message }, 'BullMQ Redis connection offline (using graceful fallback)');
    });
    redisClient.connect().catch(() => {});
  }
  return redisClient;
}

const connection = getRedisConnection();

export const webhookQueue = new Queue('smma-webhooks', { connection });
export const delayedCommentQueue = new Queue('smma-delayed-comments', { connection });

export async function enqueueWebhookJob(type: 'META' | 'WHATSAPP', data: MetaWebhookJobData | WhatsAppWebhookJobData): Promise<void> {
  if (isRedisConnected) {
    try {
      await webhookQueue.add(type, data, {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
      return;
    } catch (e: any) {
      logger.warn({ err: e.message }, 'Redis enqueue failed, executing via async fallback');
    }
  }
  setImmediate(async () => {
    if (type === 'META') await processMetaWebhookJob(data as MetaWebhookJobData);
    else await processWhatsAppWebhookJob(data as WhatsAppWebhookJobData);
  });
}

export async function enqueueDelayedSelfComment(data: {
  tenantId: string;
  channel: string;
  content: string;
  postId: string;
}): Promise<void> {
  if (isRedisConnected) {
    try {
      await delayedCommentQueue.add('self-comment', data, {
        delay: 60000,
        removeOnComplete: true,
        removeOnFail: 100,
      });
      return;
    } catch (e: any) {
      logger.warn({ err: e.message }, 'Redis delay enqueue failed, using local timer fallback');
    }
  }
  setTimeout(async () => {
    try {
      await invokeAgentEngine({
        tenantId: data.tenantId,
        channel: data.channel,
        incomingMessage: data.content,
        targetAgent: 'SELF_COMMENTER',
      });
    } catch (err: any) {
      logger.error({ err: err.message, postId: data.postId }, 'Delayed self-comment failed');
    }
  }, 60000);
}

export function startBullMQWorkers(): void {
  new Worker(
    'smma-webhooks',
    async (job: Job) => {
      if (job.name === 'META') await processMetaWebhookJob(job.data);
      else if (job.name === 'WHATSAPP') await processWhatsAppWebhookJob(job.data);
    },
    { connection, concurrency: 10 }
  ).on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Webhook worker job failed');
  });

  new Worker(
    'smma-delayed-comments',
    async (job: Job) => {
      await invokeAgentEngine({
        tenantId: job.data.tenantId,
        channel: job.data.channel,
        incomingMessage: job.data.content,
        targetAgent: 'SELF_COMMENTER',
      });
      logger.info({ postId: job.data.postId }, 'Agent #1 BullMQ delayed self-comment executed successfully');
    },
    { connection, concurrency: 5 }
  ).on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Delayed comment worker job failed');
  });
}
