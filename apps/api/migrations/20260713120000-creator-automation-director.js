/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {typeof import('sequelize')} Sequelize */

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('AutomationRules', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false,
    },
    enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    triggerType: {
      type: Sequelize.STRING(64),
      allowNull: false,
    },
    triggerConfig: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    actions: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('AutomationRules', ['userId', 'triggerType']);

  await queryInterface.createTable('StreamDirectorSessions', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    },
    contentId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Contents', key: 'id' },
      onDelete: 'SET NULL',
    },
    title: {
      type: Sequelize.STRING(500),
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'live',
    },
    platform: {
      type: Sequelize.STRING(40),
      allowNull: true,
    },
    steps: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    },
    startedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    endedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('StreamDirectorSessions', ['userId', 'status']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('StreamDirectorSessions');
  await queryInterface.dropTable('AutomationRules');
}
