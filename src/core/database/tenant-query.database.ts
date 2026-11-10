import { pool } from './pool.database';
import { logger } from '../config/logger.config';
import { QueryResult, QueryResultRow } from 'pg';

/**
 * Executes a PostgreSQL query strictly isolated to the specified tenant ID via Row-Level Security.
 */
export async function executeTenantQuery<T extends QueryResultRow = any>(
  tenantId: string,
  sqlText: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
    const result = await client.query<T>(sqlText, params);
    await client.query('COMMIT');
    return result;
  } catch (error: any) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, tenantId }, 'Tenant RLS query execution failed');
    throw error;
  } finally {
    client.release();
  }
}
