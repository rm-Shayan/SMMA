import { pool } from '../core/database/pool.database';
import { logger } from '../core/config/logger.config';
import { hashPassword } from '../modules/auth/auth.service';

export async function runSeed(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Seed Default Subscription Plans
    const plansSql = `
      INSERT INTO subscription_plans 
      (plan_name, monthly_price_cents, max_social_accounts, max_inbound_replies, max_scheduled_posts, max_outreach_messages, max_rag_documents)
      VALUES 
        ('INTERNAL_UNLIMITED', 0, 99999, 9999999, 9999999, 9999999, 99999),
        ('FREE_STARTER', 0, 2, 100, 15, 30, 3),
        ('GROWTH_PRO', 4900, 10, 2000, 150, 500, 25),
        ('AGENCY_ENTERPRISE', 14900, 999, 15000, 9999, 3000, 999)
      ON CONFLICT (plan_name) DO NOTHING;
    `;
    await client.query(plansSql);

    // 2. Seed Founding Master Agency Tenant
    const masterTenantSql = `
      INSERT INTO tenants 
      (company_name, brand_voice, is_internal, current_plan, billing_provider)
      SELECT 'Master Agency HQ', 'Authoritative, cutting-edge, conversion-focused', true, 'INTERNAL_UNLIMITED', 'MANUAL'
      WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE is_internal = true);
    `;
    await client.query(masterTenantSql);

    const tenantRes = await client.query(`SELECT id FROM tenants WHERE is_internal = true LIMIT 1;`);
    const tenantId = tenantRes.rows[0]?.id;

    // 3. Seed Default Platform Users (Verified by default)
    const users = [
      { email: 'admin@agency.com', role: 'SUPERADMIN', name: 'Platform Owner', pass: 'admin123456', tId: null },
      { email: 'owner@agency.com', role: 'CLIENT_OWNER', name: 'Agency Boss', pass: 'owner123456', tId: tenantId },
      { email: 'operator@agency.com', role: 'AGENT_OPERATOR', name: 'Support Operator', pass: 'operator123456', tId: tenantId },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO platform_users (tenant_id, email, password_hash, role, full_name, email_verified)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (email) DO UPDATE SET email_verified = TRUE;`,
        [u.tId, u.email, hashPassword(u.pass), u.role, u.name],
      );
      logger.info(`✅ Seeded ${u.role}: ${u.email}`);
    }

    await client.query('COMMIT');
    logger.info('Database seeding completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, '❌ Seeding failed');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runSeed().then(() => process.exit(0)).catch(() => process.exit(1));
}
