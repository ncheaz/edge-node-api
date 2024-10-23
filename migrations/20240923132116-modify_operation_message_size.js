'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Change the column to TEXT type
        return queryInterface.changeColumn('assets', 'operation_message', {
            type: Sequelize.TEXT,
            allowNull: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Revert the column back to its original type
        return queryInterface.changeColumn('assets', 'operation_message', {
            type: Sequelize.STRING(255), // Revert to original size (if it was VARCHAR(255))
            allowNull: true
        });
    }
};
