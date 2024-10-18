const express = require('express');
const router = express.Router();
const knowledgeBankController = require('../controllers/knowledgeBankController');
const multer = require('multer');
const {
    setupUploaders,
    createStorageFolder
} = require('../services/storageUtils');
const authServiceMiddleware = require('../middleware/authServiceMiddleware');
const axios = require('axios');

createStorageFolder();

const { uploadDataset, uploadAsset } = setupUploaders();

router.get(
    '/datasets',
    authServiceMiddleware.authMiddleware,
    knowledgeBankController.getDatasets
);
router.get(
    '/assets',
    authServiceMiddleware.authMiddleware,
    knowledgeBankController.getAssets
);
router.get(
    '/assets/preview/:assetId',
    authServiceMiddleware.authMiddleware,
    knowledgeBankController.previewAsset
);
router.get(
    '/assets/preview-external',
    authServiceMiddleware.authMiddleware,
    knowledgeBankController.previewAssetExternal
);
router.post('/assets/metadata', knowledgeBankController.getAssetsMetadata);
router.post(
    '/datasets/import',
    authServiceMiddleware.authMiddleware,
    uploadDataset.single('file'),
    knowledgeBankController.importDataset
);
router.post(
    '/assets/create',
    authServiceMiddleware.authMiddleware,
    knowledgeBankController.confirmAndCreateAssets
);

module.exports = router;
