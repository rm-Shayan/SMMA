import { Pool } from 'pg';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err: err.message }, 'Unexpected PostgreSQL pool error');
});
