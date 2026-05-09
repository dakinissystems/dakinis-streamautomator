/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {typeof import('sequelize')} Sequelize */

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Users', 'platformAuthSub', {
    type: Sequelize.STRING(36),
    allowNull: true,
    unique: true,
    comment: 'dakinis platform/auth JWT sub (UUID) for unified login',
  });

  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres') {
    await queryInterface.sequelize.query(`
      INSERT INTO tenants (name, slug, plan) VALUES ('Default', 'default', 'free')
      ON CONFLICT (slug) DO NOTHING;
    `);
  }
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Users', 'platformAuthSub');
}
