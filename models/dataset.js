'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Dataset extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }

    Dataset.init(
        {
            filename: {
                type: DataTypes.STRING,
                allowNull: true
            },
            url: {
                type: DataTypes.STRING,
                allowNull: true
            },
            processing_status: {
                type: DataTypes.ENUM,
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
            pipeline_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            run_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            error_message: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: 'Dataset',
            timestamps: true, // Enable timestamps (default behavior)
            createdAt: 'created_at', // Custom field name for createdAt
            updatedAt: 'updated_at', // Custom field name for updatedAt
            tableName: 'datasets'
        }
    );
    return Dataset;
};
