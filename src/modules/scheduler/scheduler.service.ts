import { pool } from '../../core/database/pool.database';
import { getNextOptimalSlot, SocialPlatform } from './scheduler.config';
import { logger } from '../../core/config/logger.config';

export interface SchedulePostInput {
  tenantId: string;
  platform: SocialPlatform;
  content: string;
  imageUrl?: string;
  exactTime?: Date;
}

export async function schedulePost(input: SchedulePostInput): Promise<string | null> {
  const { tenantId, platform, content, imageUrl, exactTime } = input;
  const targetTime = exactTime || getNextOptimalSlot(platform);

  const sql = `
    INSERT INTO scheduled_posts 
    (tenant_id, platform, content, image_url, scheduled_at, status)
    VALUES ($1, $2, $3, $4, $5, 'PENDING')
    RETURNING id, scheduled_at;
  `;

  try {
    const res = await pool.query(sql, [tenantId, platform, content, imageUrl || null, targetTime]);
    const post = res.rows[0];
    logger.info({ id: post.id, platform, time: post.scheduled_at }, '📅 Post scheduled for peak hour');
    return post.id;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to schedule post');
    return null;
  }
}

export async function getDuePosts(): Promise<any[]> {
  const sql = `
    SELECT sp.id, sp.tenant_id, sp.platform, sp.content, sp.image_url, sp.scheduled_at,
           tc.access_token, tc.account_id
    FROM scheduled_posts sp
    LEFT JOIN tenant_credentials tc 
      ON sp.tenant_id = tc.tenant_id AND sp.platform = tc.platform
    WHERE sp.status = 'PENDING' AND sp.scheduled_at <= NOW()
    ORDER BY sp.scheduled_at ASC
    LIMIT 20;
  `;
  try {
    const res = await pool.query(sql);
    return res.rows;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to query due posts');
    return [];
  }
}

export async function markPostPublished(postId: string): Promise<void> {
  await pool.query(
    `UPDATE scheduled_posts SET status = 'PUBLISHED', published_at = NOW() WHERE id = $1;`,
    [postId]
  );
}
