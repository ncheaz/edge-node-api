'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('datasets', 'pipeline_id', {
            type: Sequelize.STRING,
            allowNull: true,
            after: 'processing_status'
        });

        await queryInterface.addColumn('datasets', 'run_id', {
            type: Sequelize.STRING,
            allowNull: true,
            after: 'pipeline_id'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('datasets', 'pipeline_id');
        await queryInterface.removeColumn('datasets', 'another_column');
    }
};
