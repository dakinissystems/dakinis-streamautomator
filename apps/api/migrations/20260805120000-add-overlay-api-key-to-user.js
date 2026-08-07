/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'overlayApiKey', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      comment: 'OBS overlay key (read-only overlays); separate from nightbotApiKey',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'overlayApiKey');
  },
};
