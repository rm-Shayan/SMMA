import { pool } from '../../db/pool';
import { getNextOptimalSlot, SocialPlatform } from './timingConfig';
import { logger } from '../../config/logger';

export interface SchedulePostInput {
  tenantId: string;
  platform: SocialPlatform;
  content: string;
  imageUrl?: string;
  exactTime?: Date;
}

/**
 * Schedules a post for the next optimal peak engagement window
 */
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
    logger.info({ id: post.id, platform, time: post.scheduled_at }, '📅 Post successfully scheduled for peak hour');
    return post.id;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to schedule post');
    return null;
  }
}

/**
 * Retrieves all posts due for immediate publication
 */
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

/**
 * Updates post status after publication
 */
export async function markPostPublished(id: string, publishedId: string | null, error?: string): Promise<void> {
  const status = publishedId ? 'PUBLISHED' : 'FAILED';
  const sql = `
    UPDATE scheduled_posts
    SET status = $1, published_post_id = $2, error_log = $3
    WHERE id = $4;
  `;
  await pool.query(sql, [status, publishedId, error || null, id]).catch(() => {});
}

