const { Notification } = require('../models');

exports.getNotifications = async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 3;
        const seenFilter = req.query.seenFilter || false;
        let notifications;

        if (seenFilter === 'false') {
            notifications = await Notification.findAndCountAll({
                offset: offset,
                limit: limit,
                order: [['created_at', 'DESC']]
            });
        } else {
            notifications = await Notification.findAndCountAll({
                offset: offset,
                limit: limit,
                where: {
                    seen: false
                },
                order: [['created_at', 'DESC']]
            });
        }

        res.json({
            totalItems: notifications.count,
            offset: offset,
            limit: limit,
            data: notifications.rows
        });
    } catch (error) {
        console.error('Error fetching paginated assets:', error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
};

exports.storeSeen = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        if (notificationIds.length > 0) {
            for (let x = 0; x < notificationIds.length; x++) {
                let notification = await Notification.findByPk(
                    notificationIds[x]
                );
                if (notification) {
                    notification.seen = true;
                    await notification.save();
                }
            }
        }
        res.json({
            message: 'Successfully stored seen notifications'
        });
    } catch (e) {
        console.error('Error storing seen notifications:', e);
        res.status(500).json({ error: 'Failed to store seen notifications' });
    }
};
