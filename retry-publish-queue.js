const {Op, QueryTypes} = require('sequelize');
const {sequelize, Asset} = require('./models');
const {Queue, Worker} = require('bullmq');
const redis = require("ioredis");
const bullBoard = require("./bull-board");
const publishService = require("./services/publishService");
const {OPERATION_STATUSES} = require("./helpers/utils");
const path = require("path");
const fs = require("fs");
const axios = require('axios');
const { BullMQOtel } = require("bullmq-otel");

const connection = new redis({
    maxRetriesPerRequest: null,
});

const retryPublishQueue = new Queue('retryPublishQueue', {connection, telemetry: new BullMQOtel("retry-publish-queue", "0.0.1")});
bullBoard.addQueue(retryPublishQueue);

new Worker('retryPublishQueue', async (job) => {
    console.log(`Starting Retry publish job...Time: ${job.data.timestamp}`);
    let wallets = null;
    try {
        let token = await axios
            .post(
                `${process.env.AUTH_SERVICE_ENDPOINT}/login`,
                {
                    username: process.env.USERNAME,
                    password: process.env.PASSWORD,
                },
                {
                    withCredentials: true,
                });

        let walletsRes = await axios.get(`${process.env.AUTH_SERVICE_ENDPOINT}/wallets`, {
            headers: {
                Authorization: `Bearer ${token.data.token}`,
            },
            withCredentials: true,
        });
        wallets = walletsRes.data.wallets;
        const userConfig = walletsRes.data.user.config;
        publishService.setUserConfig(userConfig);
    } catch (e) {
        wallets = null;
        console.error(e)
        console.log("Failed to get wallets.")
    }

    const failedAssets = await Asset.findAll({
        where: {
            publishing_status: {
                [Op.or]: ["FAILED", "NOT-STARTED"],
            },
        },
        limit: 100
    });

    const promises = failedAssets.map((asset, i) => async () => {
        let result = null;
        let wallet = await publishService.defineNextWallet(wallets);
        try {
            await publishService.updatePublishingStatus(asset, OPERATION_STATUSES["IN-PROGRESS"], null, null, wallet);
            console.time(`Asset create - ${asset.id}`);
            let publishServiceEndpoint = "internal";
            const contentPath = path.join(__dirname, asset.url);
            const assetContentString = await fs.promises.readFile(contentPath, {encoding: 'utf-8'});
            result = await publishService.createAsset(publishServiceEndpoint, JSON.parse(assetContentString), wallet);
            console.timeEnd(`Asset create - ${asset.id}`);

            const publishStatus = publishService.defineStatus(result?.operation?.localStore?.status, result?.operation?.submitToParanet?.status);
            await publishService.updatePublishingStatus(
                asset,
                publishStatus,
                result,
                publishStatus === OPERATION_STATUSES.COMPLETED
                    ? null
                    : 'Operation timeout. Retried.',
                wallet
            );
        } catch (e) {
            console.error(e);
            await publishService.updatePublishingStatus(asset, OPERATION_STATUSES.FAILED, null, 'Operation timeout. Retried. ' + e.message, wallet);
            throw e;
        }
    })

    const results = await Promise.allSettled(promises.map(f => f()));

    console.log(`Retry publish job completed.Time: ${job.data.timestamp}`);
    return results;
}, {
    connection,
    concurrency: 1,
    telemetry: new BullMQOtel("retry-publish-queue", "0.0.1"),
});

// Add Jobs Every 5 minutes
setInterval(async () => {
    console.log('Queueing Retry publish job...');
    await retryPublishQueue.add('retryPublishQueue', {timestamp: Date.now()}, { removeOnComplete: true, removeOnFail: true });
}, 300000);
