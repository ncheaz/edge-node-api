const path = require("path");
const fs = require("fs");
const multer = require("multer");

exports.createStorageFolder = () => {
    const storageDir = path.join(__dirname, '../storage');
    const datasetsDir = path.join(__dirname, '../storage/datasets');
    const assetsDir = path.join(__dirname, '../storage/assets');
    if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
    }
    if (!fs.existsSync(datasetsDir)) {
        fs.mkdirSync(datasetsDir, { recursive: true });
    }
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }
}

exports.setupUploaders = () => {
    const datasetsStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'storage/datasets'); // Directory to save the uploaded files
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname); // Set the filename
        }
    });
    const uploadDataset = multer({ storage: datasetsStorage });

    const assetsStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'storage/assets'); // Directory to save the uploaded files
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname); // Set the filename
        }
    });
    const uploadAsset = multer({ storage: assetsStorage });
    return { uploadDataset, uploadAsset };
}
