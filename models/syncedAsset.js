'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SyncedAsset extends Model {
    static associate(models) {
      // define association here
    }
  }
  SyncedAsset.init({
    notification_id: DataTypes.INTEGER,
    blockchain_id: DataTypes.STRING,
    ual: DataTypes.STRING,
    paranet_ual: DataTypes.STRING,
    public_assertion_id: DataTypes.STRING,
    private_assertion_id: DataTypes.STRING,
    sender: DataTypes.STRING,
    transaction_hash: DataTypes.STRING,
    backend_synced_at: DataTypes.DATE,
    runtime_node_synced_at: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'SyncedAsset',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'synced_assets',
  });
  return SyncedAsset;
};
