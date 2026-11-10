import { Pool } from 'pg';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000,
  query_timeout: 10000,
});

pool.on('error', (err) => {
  logger.error({ err: err.message }, 'Unexpected PostgreSQL pool error');
});

pool.on('acquire', () => {
  if (pool.waitingCount > 3) {
    logger.warn({ waiting: pool.waitingCount, total: pool.totalCount }, 'High PostgreSQL pool demand detected');
  }
});

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT 1 as healthy;');
    return res.rows?.[0]?.healthy === 1;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Database health check failed');
    return false;
  }
}
