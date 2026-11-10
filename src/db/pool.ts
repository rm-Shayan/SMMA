import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client pool');
});

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (err) {
    logger.error({ err }, 'Failed to connect to PostgreSQL database');
    return false;
  }
};

