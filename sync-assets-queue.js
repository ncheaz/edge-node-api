const externalSequelize = require('./runtime-node-sequelize-connection');
const {QueryTypes} = require('sequelize');
const sequelize = require('sequelize');
const {SyncedAsset, Notification} = require('./models');
const {Queue, Worker} = require('bullmq');
const redis = require("ioredis");
const connection = new redis({
    maxRetriesPerRequest: null,
});

const mockWait = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const syncQueue = new Queue('syncQueue', {connection});

new Worker('syncQueue', async (job) => {
    console.log(`Starting sync job...Time: ${job.data.timestamp}`);
    try {
        let internalSyncedAssets = await SyncedAsset.count();
        if (internalSyncedAssets === 0) {
            console.log(`First time query...`);
            const assets = await externalSequelize.query(getInitialQuery(), {
                type: QueryTypes.SELECT
            });
            if(assets.length > 0) {
                let notification = await storeNotification(assets);
                await storeSyncedAssets(assets, notification);
            }
        } else if (internalSyncedAssets > 0) {
            const lastSyncedAsset = await SyncedAsset.findOne({
                order: [['id', 'DESC']]
            });
            const assets = await externalSequelize.query(getNextQuery(getFormattedDate2(lastSyncedAsset.backend_synced_at)), {
                type: QueryTypes.SELECT
            });
            if(assets.length > 0) {
                let notification = await storeNotification(assets);
                await storeSyncedAssets(assets, notification);
            }
        }
    } catch (error) {
        console.error(error);
    }
    console.log(`Sync job completed.Time: ${job.data.timestamp}`);
}, {
    connection,
    concurrency: 1  // Ensure only one job runs at a time
});

// Add Jobs Every 30 Seconds
setInterval(async () => {
    console.log('Queueing sync job...');
    await syncQueue.add('syncJob', {timestamp: Date.now()});
}, 10000);

const getInitialQuery = () => {
    return `
        SELECT sa.*
        FROM paranet_synced_asset sa
                 INNER JOIN (
            SELECT ual, MAX(id) AS max_id
            FROM paranet_synced_asset
            WHERE (ual, created_at) IN
                  (SELECT ual, MAX(created_at)
                   FROM paranet_synced_asset
                   GROUP BY ual)
            GROUP BY ual) latest
                            ON sa.id = latest.max_id`
}

const getNextQuery = (date) => {
    return `
    SELECT sa.*
    FROM paranet_synced_asset sa
             INNER JOIN (
        SELECT ual, MAX(id) AS max_id
        FROM paranet_synced_asset
        WHERE created_at > '${date}'  -- Replace with your desired date
          AND (ual, created_at) IN
              (SELECT ual, MAX(created_at)
               FROM paranet_synced_asset
               WHERE created_at > '${date}'  -- Same date filter here
               GROUP BY ual)
        GROUP BY ual
    ) latest
                        ON sa.id = latest.max_id;`
}

function getCurrentTimeProperFormat() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getFormattedDate(inputDate) {
    // Convert to a string and remove the 'Z' to avoid UTC conversion
    const dateString = inputDate.toISOString().replace('Z', '');

    // Manually extract year, month, day, hour, minute, second from the ISO string
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split(':');

    // Combine them into the desired format
    return `${year}-${month}-${day} ${hour}:${minute}:${second.split('.')[0]}`;
}

function getFormattedDate2(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function storeNotification(assets) {
    let notification = await Notification.create({ title: "New hash lists"});
    notification.message = `Your node has ingested ${assets.length} new hash lists (knowledge assets) since your last login.`
    await notification.save();
    return notification;
}

async function storeSyncedAssets(assets, notification) {
    for (let x = 0; x < assets.length; x++) {
        let syncedData = assets[x];
        syncedData.backend_synced_at = getCurrentTimeProperFormat();
        syncedData.runtime_node_synced_at = getFormattedDate(syncedData.created_at);
        syncedData.notification_id = notification.id;
        delete syncedData.id;
        delete syncedData.created_at;
        delete syncedData.updated_at;
        let createdSyncedAsset = await SyncedAsset.create(syncedData);
    }
    return true;
}
