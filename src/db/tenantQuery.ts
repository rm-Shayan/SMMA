import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { pool } from './pool';

export interface TenantContext {
  tenantId: string;
}

/**
 * Executes a callback within an isolated PostgreSQL transaction
 * enforcing Row-Level Security for the specified tenant.
 */
export async function withTenantTransaction<T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', tenantId]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Executes a single parameterized query under the tenant's RLS session.
 */
export async function tenantQuery<R extends QueryResultRow = any>(
  tenantId: string,
  sql: string,
  params: any[] = []
): Promise<QueryResult<R>> {
  return withTenantTransaction(tenantId, async (client) => {
    return client.query<R>(sql, params);
  });
}

