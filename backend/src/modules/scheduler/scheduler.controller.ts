import { Request, Response } from 'express';
import { z } from 'zod';
import { schedulePost } from './scheduler.service';
import { invokeAgentEngine } from '../agents/agent.workflow';
import { logger } from '../../core/config/logger.config';

const PublishPostSchema = z.object({
  platform: z.enum(['linkedin', 'instagram', 'twitter', 'facebook']),
  draftContent: z.string().min(5),
  imageUrl: z.string().url().optional(),
  autoScheduleOptimal: z.boolean().default(true),
  exactTime: z.string().datetime().optional(),
});

export async function handleSchedulePost(req: Request, res: Response): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required' });
    return;
  }

  const parsed = PublishPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.format() });
    return;
  }

  const { platform, draftContent, imageUrl, autoScheduleOptimal, exactTime } = parsed.data;

  try {
    const formatted = await invokeAgentEngine({
      tenantId,
      channel: platform.toUpperCase() as any,
      incomingMessage: draftContent,
      targetAgent: 'POST_DISTRIBUTION',
    });

    const finalContent = formatted.generatedResponse || draftContent;
    const scheduledTime = exactTime ? new Date(exactTime) : undefined;

    const scheduledPostId = await schedulePost({
      tenantId,
      platform,
      content: finalContent,
      imageUrl,
      exactTime: autoScheduleOptimal ? undefined : scheduledTime,
    });

    res.status(201).json({
      success: true,
      message: 'Post successfully scheduled by Agent #8',
      postId: scheduledPostId,
      formattedContent: finalContent,
    });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to schedule post');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

