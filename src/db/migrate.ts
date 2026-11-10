import fs from 'fs';
import path from 'path';
import { pool } from './pool';
import { logger } from '../config/logger';

export async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  logger.info(`Found ${files.length} migration files in ${migrationsDir}`);

  const client = await pool.connect();
  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      logger.info(`Executing migration: ${file}`);
      await client.query(sql);
      logger.info(`✅ Successfully applied: ${file}`);
    }
  } catch (error) {
    logger.error({ error }, '❌ Migration failed');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('All database migrations applied successfully.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Failed to apply migrations');
      process.exit(1);
    });
}

