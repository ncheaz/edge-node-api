const datasetService = require('../services/datasetService');
const kMiningService = require('../services/kMiningService');
const path = require('path');
const fs = require('fs');
const {Asset, SyncedAsset} = require("../models");
const {OPERATION_STATUSES} = require("../helpers/utils");
const publishService = require('../services/publishService.js');
const { Op, Sequelize } = require('sequelize');
const internalSequelize = require('../models/index');

exports.getDatasets = async (req, res) => {
    try {
        const datasets = [];
        res.status(200).json(datasets);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.getAssets = async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;

        const assets = await internalSequelize.sequelize.query(`WITH RankedAssets AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY ual ORDER BY created_at DESC, id DESC) AS row_num
    FROM synced_assets
)
SELECT *
FROM RankedAssets
WHERE row_num = 1
ORDER BY created_at DESC, id DESC
LIMIT ${limit} OFFSET ${offset}`, {
            type: internalSequelize.Sequelize.QueryTypes.SELECT
        });

        const total = await internalSequelize.sequelize.query(`select ual, count(*)
                                                         from synced_assets
                                                         group by ual`,
            {
                type: internalSequelize.Sequelize.QueryTypes.SELECT
            });

        res.json({
            totalItems: total.length,
            offset: offset,
            limit: limit,
            data: assets,
        });
    } catch (error) {
        console.error('Error fetching paginated assets:', error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
};

exports.previewAssetExternal = async (req, res) => {
    const { assetUAL } = req.query;

    try {
        const sessionCookie = req.headers.cookie;
        //todo: This part is not needed, we should define blockchain based on passed ual. We should refactor it after v1
        let wallets = await publishService.getWallets(sessionCookie);
        const wallet = await publishService.defineNextWallet(wallets);
        let blockchain = publishService.defineBlockchainSettings(wallet);

        const userConfig = req.user.config;
        const formattedUserConfig = publishService.setUserConfig(userConfig);

        const DkgClient = publishService.initDkgClient(blockchain);
        let result = await DkgClient.asset.get(assetUAL, {
            paranetUAL: formattedUserConfig.edge_node_paranet_ual
        });
        let formattedKnowledgeAsset = {};
        formattedKnowledgeAsset.private = result.private.assertion;
        formattedKnowledgeAsset.public = result.public.assertion;
        res.json(formattedKnowledgeAsset);

    } catch (error) {
        console.error('Error fetching asset:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.previewAsset = async (req, res) => {
    const { assetId } = req.params;

    try {
        const asset = await Asset.findOne({
            where: { id: assetId },
        });

        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }


        const filePath = path.join(__dirname, `../${asset.url}`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found at the provided URL' });
        }

        const stream = fs.createReadStream(filePath);
        stream.on('error', (error) => {
            console.error('Error reading file:', error);
            return res.status(500).json({ error: 'Error reading file' });
        });


        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);

        stream.pipe(res);

    } catch (error) {
        console.error('Error fetching asset or file:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.importDataset = async (req, res) => {
    let inputDatasetDBRecord;
    try {
        console.time('Store input dataset and prepare KMining request');
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        const sessionCookie = req.headers.cookie;

        let storagePath = '/storage/datasets';
        const relativePath = `${storagePath}/${req.file.filename}`;
        inputDatasetDBRecord = await datasetService.storeInputDataset(relativePath, req.file.filename);
        await datasetService.updateDatasetProcessingStatus(inputDatasetDBRecord.id, OPERATION_STATUSES["IN-PROGRESS"]);

        const kMiningEndpoint = req.user.config.find(item => item.option === 'kmining_endpoint').value;
        const kMiningPipelineId = await kMiningService.defineProcessingPipelineId(req);
        console.timeEnd('Store input dataset and prepare KMining request');

        console.time('K Mining pipeline');
        const stagedKnowledgeAssets = await kMiningService.triggerPipeline(req.file, sessionCookie, kMiningEndpoint, kMiningPipelineId, inputDatasetDBRecord);
        console.timeEnd('K Mining pipeline');

        console.time('Other');
        let {
            filenames,
            assetsData
        } = await datasetService.storeStagedAssetsToStorage(stagedKnowledgeAssets, inputDatasetDBRecord);
        let {
            errors,
            finalAssets
        } = await datasetService.storeStagedAssetsToDB(filenames, inputDatasetDBRecord, assetsData);

        await datasetService.updateDatasetProcessingStatus(inputDatasetDBRecord.id, OPERATION_STATUSES.COMPLETED);
        console.timeEnd('Other');
        res.status(200).json({
            message: "Dataset successfully processed and stored.",
            datasetId: inputDatasetDBRecord.id,
            errors: errors,
            assets: finalAssets,
        });

    } catch (e) {
        if (inputDatasetDBRecord) {
            await datasetService.updateDatasetProcessingStatus(inputDatasetDBRecord.id, OPERATION_STATUSES.FAILED, e.message);
        }
        res.status(400).json({
            message: e.message,
        });
    }
};

exports.confirmAndCreateAssets = async (req, res) => {
    try {
        console.time('Prepare config');
        const { knowledgeAssets } = req.body;
        const sessionCookie = req.headers.cookie;
        let wallets = await publishService.getWallets(sessionCookie);
        const userConfig = req.user.config;
        publishService.setUserConfig(userConfig);
        console.timeEnd('Prepare config');

        if (knowledgeAssets.length > 0) {
            for (let index = 0; index < knowledgeAssets.length; index++) {
                let {assetId, content} = knowledgeAssets[index];
                let asset = await Asset.findByPk(assetId);
                let wallet = null;

                try {
                    console.time('Before create');
                    await datasetService.storeUpdatedKAContent(asset, JSON.parse(content));
                    const publishServiceEndpoint = req.user.config.find(item => item.option === 'publish_service_endpoint').value;

                    await publishService.updatePublishingStatus(asset, OPERATION_STATUSES["IN-PROGRESS"], null, null);

                    wallet = await publishService.defineNextWallet(wallets);
                    console.timeEnd('Before create');

                    console.time('Asset create');
                    const result = await publishService.createAsset(publishServiceEndpoint, JSON.parse(content), wallet);
                    console.timeEnd('Asset create');

                    if (result && result?.operation?.localStore && result && result?.operation?.submitToParanet) {
                        await publishService.updatePublishingStatus(asset, publishService.defineStatus(result.operation.localStore.status, result.operation.submitToParanet.status), result, null, wallet);
                    } else {
                        await publishService.updatePublishingStatus(asset, OPERATION_STATUSES.FAILED, result, "Something went wrong! Publish data is missing.", wallet);
                    }
                    if (knowledgeAssets.length === 1) {
                        return res.status(200).json({
                            message: 'Knowledge asset created.', data: {
                                UAL: result.UAL,
                                assertionId: result.publicAssertionId,
                                transactionHash: result?.operation?.mintKnowledgeAsset.transactionHash,
                                status: publishService.defineStatus(result.operation.localStore.status, result.operation.submitToParanet.status)
                            }
                        });
                    }
                } catch (e) {
                    console.error(e);
                    await publishService.updatePublishingStatus(asset, OPERATION_STATUSES.FAILED, null, e.message, wallet);
                    return res.status(500).json({error: 'An error occurred while creating the knowledge asset', details: e.message});
                }
            }
        }
        return res.status(200).json({message: 'Creation of knowledge assets has been started.'});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: 'An error occurred while processing the knowledge asset', details: error.message});
    }
};

exports.getAssetsMetadata = async (req, res) => {
    try {
        const { uals } = req.body;
        let finalData = {};
        if(uals.length > 0) {
            for (let x = 0; x < uals.length; x++) {
                let asset = await SyncedAsset.findOne({
                    where: {
                        ual: uals[x]
                    }
                });
                if(asset) {
                    finalData[uals[x]] = {
                        transaction_hash: asset.transaction_hash,
                        public_assertion_id: asset.public_assertion_id,
                    }
                } else {
                    finalData[uals[x]] = "No data found";
                }
            }
        }
        res.json({
            data: finalData
        });
    } catch (e) {
        console.error('Error getting assets metadata:', e);
        res.status(500).json({ error: 'Failed to get assets metadata' });
    }
}
