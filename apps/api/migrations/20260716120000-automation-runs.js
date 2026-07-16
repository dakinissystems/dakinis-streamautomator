/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {typeof import('sequelize')} Sequelize */

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('AutomationRuns', {
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
    ruleId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'AutomationRules', key: 'id' },
      onDelete: 'CASCADE',
    },
    triggerType: {
      type: Sequelize.STRING(64),
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'ok',
    },
    result: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    error: {
      type: Sequelize.TEXT,
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

  await queryInterface.addIndex('AutomationRuns', ['userId', 'ruleId', 'createdAt']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('AutomationRuns');
}
