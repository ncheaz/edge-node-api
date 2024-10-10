'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('synced_assets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      notification_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'notifications',
          key: 'id',
        },
        allowNull: true,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      blockchain_id: {
        type: Sequelize.STRING
      },
      ual: {
        type: Sequelize.STRING
      },
      paranet_ual: {
        type: Sequelize.STRING
      },
      public_assertion_id: {
        type: Sequelize.STRING
      },
      private_assertion_id: {
        type: Sequelize.STRING
      },
      sender: {
        type: Sequelize.STRING
      },
      transaction_hash: {
        type: Sequelize.STRING
      },
      backend_synced_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      runtime_node_synced_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('synced_assets');
  }
};
