/**
 * SaaS multi-tenant schema for Postgres (Docker / dakinis_stream).
 * Fixes: tenant_id missing on Integrations / Contents / … and tenants + memberships tables missing.
 */

/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {typeof import('sequelize')} Sequelize */

export default {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'postgres') {
      return;
    }

    const { sequelize } = queryInterface;

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        plan TEXT NOT NULL DEFAULT 'free',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS memberships (
        user_id INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
        tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, tenant_id)
      );
    `);

    const addTenantId = async (table) => {
      await sequelize.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS tenant_id BIGINT NULL;`
      );
    };

    const tablesWithTenant = [
      'Contents',
      'Media',
      'Payments',
      'Integrations',
      'AuditLogs',
      'Notifications',
      'FeatureFlags',
    ];

    for (const t of tablesWithTenant) {
      await addTenantId(t);
    }

    await sequelize.query(`
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'Integrations' AND c.contype = 'u'
  ) LOOP
    EXECUTE format('ALTER TABLE "Integrations" DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;
    `);

    await sequelize.query(`
      DROP INDEX IF EXISTS integrations_user_provider_tenant_unique;
    `);

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS integrations_user_provider_tenant_unique
      ON "Integrations" ("userId", provider, tenant_id);
    `);
  },

  async down() {
    // Non-destructive rollback omitted (drops risk production data).
  },
};
