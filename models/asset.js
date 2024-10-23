'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Asset extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Asset.init(
        {
            dataset_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'Dataset', // name of Target model
                    key: 'id' // key in Target model that we're referencing
                },
                allowNull: false,
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            filename: {
                type: DataTypes.STRING,
                allowNull: true
            },
            url: {
                type: DataTypes.STRING,
                allowNull: true
            },
            publishing_status: {
                type: DataTypes.ENUM,
                values: [
                    'NOT-STARTED',
                    'IN-PROGRESS',
                    'COMPLETED',
                    'FAILED',
                    'READY-FOR-UPDATE'
                ],
                allowNull: false,
                defaultValue: 'NOT-STARTED'
            },
            operation_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            operation_message: {
                type: DataTypes.STRING,
                allowNull: true
            },
            ual: {
                type: DataTypes.STRING,
                allowNull: true
            },
            assertion_id: {
                type: DataTypes.STRING,
                allowNull: true
            },
            blockchain: {
                type: DataTypes.STRING,
                allowNull: true
            },
            wallet: {
                type: DataTypes.STRING,
                allowNull: true
            },
            transaction_hash: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: 'Asset',
            timestamps: true, // Enable timestamps (default behavior)
            createdAt: 'created_at', // Custom field name for createdAt
            updatedAt: 'updated_at', // Custom field name for updatedAt
            tableName: 'assets'
        }
    );
    return Asset;
};
