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
    logger.info('✅ Subscription plans seeded.');

    // 2. Seed Founding Master Agency Tenant (is_internal = true)
    const masterTenantSql = `
      INSERT INTO tenants 
      (company_name, brand_voice, is_internal, current_plan, billing_provider)
      SELECT 'Master Agency HQ', 'Authoritative, cutting-edge, conversion-focused', true, 'INTERNAL_UNLIMITED', 'MANUAL'
      WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE is_internal = true);
    `;
    await client.query(masterTenantSql);
    logger.info('✅ Master Agency Tenant seeded (is_internal: true).');

    // 3. Seed Default SuperAdmin User
    const adminSql = `
      INSERT INTO platform_users 
      (email, password_hash, role, full_name)
      VALUES ('admin@agency.com', $1, 'SUPERADMIN', 'Platform Owner')
      ON CONFLICT (email) DO NOTHING;
    `;
    await client.query(adminSql, [hashPassword('admin123456')]);
    logger.info('✅ Platform SuperAdmin seeded (admin@agency.com).');

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, '❌ Seeding failed');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runSeed()
    .then(() => {
      logger.info('Database seeding completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Seeding failed');
      process.exit(1);
    });
}

