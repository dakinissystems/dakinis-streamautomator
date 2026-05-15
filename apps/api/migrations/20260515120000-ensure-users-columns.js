/**
 * Ensure all Users columns exist (repair prod DBs where migrations were never applied).
 * Safe to run multiple times.
 */

export default {
  async up(queryInterface, Sequelize) {
    const table = 'Users';
    const columns = await queryInterface.describeTable(table);

    const toAdd = [
      { name: 'platformAuthSub', type: Sequelize.STRING(36), allowNull: true },
      { name: 'oauthProvider', type: Sequelize.STRING, allowNull: true },
      { name: 'oauthId', type: Sequelize.STRING, allowNull: true },
      { name: 'googleId', type: Sequelize.STRING, allowNull: true },
      { name: 'twitchId', type: Sequelize.STRING, allowNull: true },
      { name: 'discordId', type: Sequelize.STRING, allowNull: true },
      { name: 'twitterId', type: Sequelize.STRING, allowNull: true },
      { name: 'twitterAccessToken', type: Sequelize.STRING, allowNull: true },
      { name: 'twitterRefreshToken', type: Sequelize.STRING, allowNull: true },
      { name: 'discordAccessToken', type: Sequelize.STRING, allowNull: true },
      { name: 'discordRefreshToken', type: Sequelize.STRING, allowNull: true },
      { name: 'licenseType', type: Sequelize.STRING, allowNull: false, defaultValue: 'none' },
      { name: 'licenseExpiresAt', type: Sequelize.DATE, allowNull: true },
      { name: 'isDisabled', type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      { name: 'merchandisingLink', type: Sequelize.STRING, allowNull: true },
      { name: 'merchandisingButtonPosition', type: Sequelize.STRING, allowNull: true, defaultValue: 'bottom-right' },
      { name: 'hasUsedTrial', type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      { name: 'trialExtensions', type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      { name: 'lastPasswordChange', type: Sequelize.DATE, allowNull: true },
      { name: 'stripeCustomerId', type: Sequelize.STRING, allowNull: true },
      { name: 'stripeSubscriptionId', type: Sequelize.STRING, allowNull: true },
      { name: 'subscriptionStatus', type: Sequelize.STRING, allowNull: true },
      { name: 'dashboardShowTwitchSubs', type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      { name: 'dashboardShowTwitchBits', type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      { name: 'dashboardShowTwitchDonations', type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      { name: 'profileImageUrl', type: Sequelize.STRING, allowNull: true },
      { name: 'discordClipsGuildId', type: Sequelize.STRING, allowNull: true },
      { name: 'discordClipsChannelId', type: Sequelize.STRING, allowNull: true },
      { name: 'nightbotApiKey', type: Sequelize.STRING, allowNull: true },
      { name: 'discordAnnounceWebhookUrl', type: Sequelize.STRING, allowNull: true },
      { name: 'akoenetWebhookUrl', type: Sequelize.STRING(2000), allowNull: true },
      { name: 'akoenetWebhookSecret', type: Sequelize.TEXT, allowNull: true },
      { name: 'akoenetAnnounceChannelId', type: Sequelize.STRING(100), allowNull: true },
      { name: 'akoenetServerId', type: Sequelize.STRING(100), allowNull: true },
      { name: 'akoenetSendClips', type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      { name: 'streamGoalType', type: Sequelize.STRING, allowNull: true },
      { name: 'streamGoalTarget', type: Sequelize.INTEGER, allowNull: true },
      { name: 'publicPageBannerUrl', type: Sequelize.STRING, allowNull: true },
      { name: 'publicPageBannerPosition', type: Sequelize.STRING, allowNull: true, defaultValue: 'top' },
    ];

    for (const col of toAdd) {
      if (columns[col.name]) continue;
      const { name, ...def } = col;
      await queryInterface.addColumn(table, name, def);
    }

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        INSERT INTO tenants (name, slug, plan) VALUES ('Default', 'default', 'free')
        ON CONFLICT (slug) DO NOTHING;
      `);
    }
  },

  async down() {
    // no-op repair migration
  },
};
