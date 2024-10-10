const {Queue, Worker, QueueScheduler} = require('bullmq');
const redis = require('ioredis');
const publishService = require('./services/publishService.js');
require('./queue-metrics');

// Create the Redis connection
const connection = new redis({
    maxRetriesPerRequest: null,
});

const queues = {};

async function createAssetJob(wallet, assetContent) {
    if (!queues[wallet]) {
        // Initialize queue for the wallet
        queues[wallet] = new Queue(`wallet-jobs-${wallet}`, {connection});

        // Create a worker for this wallet's queue
        new Worker(
            `wallet-jobs-${wallet}`,
            async (job) => {
                const {wallet} = job.data;
                await createKnowledgeAsset(wallet, assetContent);
            },
            {connection, concurrency: 1} // Ensure one job per wallet at a time
        );
    }

    //add job to the queue
    await queues[wallet].add(
        `wallet-job-${wallet}`, // Unique job name per wallet
        {wallet},
        {
            removeOnComplete: true, // Clean up after job is processed
        }
    );
}
async function createKnowledgeAsset(wallet, assetContent) {
    console.log(`Processing Asset create job for wallet ${wallet}:`);
    let result = await publishService.createAsset("internal", assetContent, wallet);
    console.log(`Finished processing Asset create job for wallet ${wallet}`);
}


module.exports = {
    createAssetJob,
};
