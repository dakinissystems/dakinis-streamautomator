/**
 * Repair production DB: missing tables/columns vs current Sequelize models.
 * Safe to run multiple times (IF NOT EXISTS / describeTable checks).
 */

export default {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const dialect = sequelize.getDialect();

    // --- tenants / memberships (SaaS) ---
    if (dialect === 'postgres') {
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
    }

    // --- Integrations table (OAuth publish; required for Twitch login) ---
    let hasIntegrations = false;
    try {
      await queryInterface.describeTable('Integrations');
      hasIntegrations = true;
    } catch {
      /* create below */
    }

    if (!hasIntegrations) {
      await queryInterface.createTable('Integrations', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        provider: { type: Sequelize.STRING, allowNull: false },
        providerUserId: { type: Sequelize.STRING, allowNull: true },
        accessToken: { type: Sequelize.TEXT, allowNull: true },
        refreshToken: { type: Sequelize.TEXT, allowNull: true },
        scopes: { type: Sequelize.JSONB, allowNull: true },
        expiresAt: { type: Sequelize.DATE, allowNull: true },
        status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'active' },
        metadata: { type: Sequelize.JSONB, allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }

    const tenantTables = ['Contents', 'Media', 'Payments', 'Integrations', 'AuditLogs', 'Notifications', 'FeatureFlags'];
    if (dialect === 'postgres') {
      for (const table of tenantTables) {
        try {
          await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS tenant_id BIGINT NULL;`);
        } catch {
          /* table may not exist yet */
        }
      }
    }

    // --- Contents columns ---
    try {
      const contentsCols = await queryInterface.describeTable('Contents');
      const contentToAdd = [
        { name: 'timezone', type: Sequelize.STRING, allowNull: true },
        { name: 'recurrence', type: Sequelize.JSONB, allowNull: true },
        { name: 'discordGuildId', type: Sequelize.STRING, allowNull: true },
        { name: 'discordChannelId', type: Sequelize.STRING, allowNull: true },
        { name: 'discordAnnouncementChannelId', type: Sequelize.STRING, allowNull: true },
        { name: 'publishedAt', type: Sequelize.DATE, allowNull: true },
        { name: 'publishError', type: Sequelize.STRING, allowNull: true },
        { name: 'idempotencyKeys', type: Sequelize.JSONB, allowNull: true },
        { name: 'retryCount', type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        { name: 'lastRetryAt', type: Sequelize.DATE, allowNull: true },
        { name: 'eventEndTime', type: Sequelize.DATE, allowNull: true },
        { name: 'eventDates', type: Sequelize.JSONB, allowNull: true },
        { name: 'eventLocationUrl', type: Sequelize.STRING, allowNull: true },
        { name: 'discordEventId', type: Sequelize.STRING, allowNull: true },
        { name: 'localVersion', type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        { name: 'discordEventVersion', type: Sequelize.INTEGER, allowNull: true },
        { name: 'discordSyncHash', type: Sequelize.STRING, allowNull: true },
        { name: 'lastSyncedAt', type: Sequelize.DATE, allowNull: true },
        { name: 'deletedAt', type: Sequelize.DATE, allowNull: true },
        { name: 'twitchSegmentId', type: Sequelize.STRING, allowNull: true },
      ];
      for (const col of contentToAdd) {
        if (contentsCols[col.name]) continue;
        const { name, ...def } = col;
        await queryInterface.addColumn('Contents', name, def);
      }
    } catch {
      /* Contents table missing — run full migrate */
    }

    try {
      const intCols = await queryInterface.describeTable('Integrations');
      if (!intCols.tenant_id) {
        await queryInterface.addColumn('Integrations', 'tenant_id', {
          type: Sequelize.BIGINT,
          allowNull: true,
        });
      }
    } catch {
      /* Integrations table still missing — run npm run migrate */
    }
  },

  async down() {
    /* repair migration */
  },
};
