'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      dataset_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'datasets', // name of Target model
          key: 'id',         // key in Target model that we're referencing
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: true
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      publishing_status: {
        type: Sequelize.ENUM,
        values: ['NOT-STARTED','IN-PROGRESS','COMPLETED','FAILED','READY-FOR-UPDATE'],
        allowNull: false,
        defaultValue: 'NOT-STARTED',
      },
      operation_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      operation_message: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ual: {
        type: Sequelize.STRING,
        allowNull: true
      },
      assertion_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      blockchain: {
        type: Sequelize.STRING,
        allowNull: true
      },
      wallet: {
        type: Sequelize.STRING,
        allowNull: true
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('assets');
  }
};
