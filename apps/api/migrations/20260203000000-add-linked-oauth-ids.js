/** @type {import('sequelize-cli').Migration} */
/** Add googleId, twitchId, discordId so one account can link multiple OAuth providers. */
export default {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');
    const add = async (name, def) => {
      if (!columns[name]) await queryInterface.addColumn('Users', name, def);
    };
    await add('googleId', { type: Sequelize.STRING, allowNull: true });
    await add('twitchId', { type: Sequelize.STRING, allowNull: true });
    await add('discordId', { type: Sequelize.STRING, allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'googleId');
    await queryInterface.removeColumn('Users', 'twitchId');
    await queryInterface.removeColumn('Users', 'discordId');
  },
};
