import { Request, Response } from 'express';
import { z } from 'zod';
import { schedulePost } from './scheduler.service';
import { invokeAgentEngine } from '../agents/agent.workflow';
import { logger } from '../../core/config/logger.config';
import { logAiOperation } from '../agents/agent.audit';

const PublishPostSchema = z.object({
  platform: z.enum(['linkedin', 'instagram', 'twitter', 'facebook']),
  draftContent: z.string().min(5),
  imageUrl: z.string().url().optional(),
  autoScheduleOptimal: z.boolean().default(true),
  exactTime: z.string().datetime().optional(),
});

function resolveTenant(req: Request): string | null {
  if (req.user?.role === 'SUPERADMIN') return (req.body?.tenantId || req.tenantId || req.user.tenantId || null) as string | null;
  return (req.user?.tenantId || req.tenantId || null) as string | null;
}

export async function handleSchedulePost(req: Request, res: Response): Promise<void> {
  const tenantId = resolveTenant(req);
  if (!tenantId || !req.user) {
    res.status(403).json({ error: 'Forbidden', message: 'Tenant context required' });
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
      actor: { userId: req.user.userId, role: req.user.role, tenantId },
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

    await logAiOperation({
      tenantId,
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      channel: platform.toUpperCase(),
      intent: 'schedule_post',
      proposedTool: 'PUBLISH_POST',
      proposedParams: { platform, autoScheduleOptimal, hasExactTime: !!exactTime },
      decision: 'ALLOW',
      decisionReason: 'Authorized schedule request',
      executedTool: 'schedule_post',
      resultStatus: scheduledPostId ? 'SUCCESS' : 'FAILED',
      resultMessage: scheduledPostId ? `Scheduled ${scheduledPostId}` : 'Scheduling failed',
    });

    res.status(201).json({ success: !!scheduledPostId, postId: scheduledPostId, formattedContent: finalContent });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to schedule post');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
