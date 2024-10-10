const internalSequelize = require('../models/index');

exports.getDashboardData = async (req, res) => {
    try {
        const userLocale = req.query.locale ?? "en-US";
        const userTimeZone = req.query.timezone ?? 'UTC';

        const latestSyncedAsset = await internalSequelize.sequelize
        .query("SELECT * FROM synced_assets ORDER BY created_at DESC LIMIT 1", 
            { type: internalSequelize.Sequelize.QueryTypes.SELECT })
        .then(res => res.at(0));

        const updatesLast24h = await internalSequelize.sequelize
        .query(`SELECT COUNT(*) as count FROM synced_assets WHERE created_at > (NOW() - INTERVAL 24 HOUR)`, 
            { type: internalSequelize.Sequelize.QueryTypes.SELECT })
        .then(res => res.at(0).count);

        const dashboardData = {
            "Node Status": "Synchronized",
            "Last information ingested": 
                latestSyncedAsset?.created_at 
                    ?  new Date(latestSyncedAsset.created_at)
                        .toLocaleString(
                            userLocale, { 
                            month: "short", 
                            day: "2-digit", 
                            year: "numeric", 
                            hour: "2-digit", 
                            minute: "2-digit",
                            timeZone: userTimeZone
                        })
                    : 'Never',
            "Updates in last 24h": (updatesLast24h === 0 ? 'No' : updatesLast24h) + " new records",
        };
        res.status(200).json(dashboardData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
