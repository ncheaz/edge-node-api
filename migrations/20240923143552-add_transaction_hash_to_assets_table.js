'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('assets', 'transaction_hash', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'wallet'
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('assets', 'transaction_hash');
  }
};
