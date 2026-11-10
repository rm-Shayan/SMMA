import { Request, Response } from 'express';
import { z } from 'zod';
import { invokeAgentEngine } from '../agents/agentWorkflow';
import { schedulePost } from '../services/scheduler/postSchedulerService';
import { getNextOptimalSlot } from '../services/scheduler/timingConfig';
import { logger } from '../config/logger';

const CreatePostSchema = z.object({
  tenantId: z.string().uuid().default('00000000-0000-0000-0000-000000000000'),
  topicOrOutline: z.string().min(5, 'Topic or draft outline is required'),
  platforms: z.array(z.enum(['INSTAGRAM', 'LINKEDIN', 'TWITTER', 'FACEBOOK'])).min(1),
  brandVoice: z.string().optional(),
  imageUrl: z.string().url().optional(),
  autoSchedulePeak: z.boolean().default(true),
});

export async function handlePublishPost(req: Request, res: Response): Promise<void> {
  const parseResult = CreatePostSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid Post Payload', details: parseResult.error.format() });
    return;
  }

  const { tenantId, topicOrOutline, platforms, brandVoice, imageUrl, autoSchedulePeak } = parseResult.data;
  const activeTenantId = req.tenantId || tenantId;
  const generatedPosts: Record<string, any> = {};

  try {
    for (const platform of platforms) {
      const finalState = await invokeAgentEngine({
        tenantId: activeTenantId,
        channel: platform,
        targetAgent: 'POST_DISTRIBUTION',
        incomingMessage: topicOrOutline,
        brandVoice: brandVoice || 'Authoritative, punchy, engaging, and professional',
      });

      const content = finalState.generatedResponse || topicOrOutline;
      let scheduledTime: Date | null = null;
      let scheduleId: string | null = null;

      if (autoSchedulePeak) {
        scheduledTime = getNextOptimalSlot(platform);
        scheduleId = await schedulePost({
          tenantId: activeTenantId,
          platform,
          content,
          imageUrl,
          exactTime: scheduledTime,
        });
      }

      generatedPosts[platform] = {
        formattedContent: content,
        autoScheduledPeak: autoSchedulePeak,
        scheduledAt: scheduledTime ? scheduledTime.toISOString() : 'IMMEDIATE',
        scheduleJobId: scheduleId,
      };
    }

    res.status(200).json({
      success: true,
      originalTopic: topicOrOutline,
      multiPlatformPosts: generatedPosts,
      message: 'Posts successfully formatted and auto-scheduled for peak platform hours!',
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to generate and schedule posts');
    res.status(500).json({ error: error.message });
  }
}
