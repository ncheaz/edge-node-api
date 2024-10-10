const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

router.get('/', notificationsController.getNotifications);
router.post('/', notificationsController.storeSeen);

module.exports = router;
