// externalSequelize.js
const { Sequelize } = require('sequelize');

// External DB connection
const runtimeNodeOperationDb = new Sequelize(
    process.env.RUNTIME_NODE_OPERATIONAL_DB_DATABASE,
    process.env.RUNTIME_NODE_OPERATIONAL_DB_USERNAME,
    process.env.RUNTIME_NODE_OPERATIONAL_DB_PASSWORD,
    {
        host: process.env.RUNTIME_NODE_OPERATIONAL_DB_HOST,
        dialect: 'mysql',
        logging: false
    }
);

module.exports = runtimeNodeOperationDb;
