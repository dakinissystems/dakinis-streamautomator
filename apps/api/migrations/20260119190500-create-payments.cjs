'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const nowDefault =
      dialect === 'sqlite' ? Sequelize.literal('(datetime(\'now\'))') : Sequelize.fn('NOW');
    const amountType = dialect === 'sqlite' ? Sequelize.REAL : Sequelize.DECIMAL(10, 2);

    await queryInterface.createTable('Payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      licenseType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'USD'
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
      },
      provider: {
        type: Sequelize.STRING,
        defaultValue: 'manual'
      },
      reference: {
        type: Sequelize.STRING
      },
      paidAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: nowDefault
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: nowDefault
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Payments');
  }
};
