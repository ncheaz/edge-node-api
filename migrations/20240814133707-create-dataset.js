'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('datasets', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            filename: {
                type: Sequelize.STRING,
                allowNull: true
            },
            url: {
                type: Sequelize.STRING,
                allowNull: true
            },
            error_message: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            processing_status: {
                type: Sequelize.ENUM,
                values: [
                    'NOT-STARTED',
                    'IN-PROGRESS',
                    'COMPLETED',
                    'FAILED',
                    'NOT-READY'
                ],
                allowNull: false,
                defaultValue: 'NOT-STARTED'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal(
                    'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
                )
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('datasets');
    }
};
