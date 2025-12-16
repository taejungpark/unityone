var mongoose = require('mongoose');
var AccessLog = mongoose.model('AccessLog');

/* GET 'Access Logs' page */
module.exports.viewLogs = function(req, res) {
    // Get query parameters for filtering
    var limit = parseInt(req.query.limit) || 100;
    var page = parseInt(req.query.page) || 1;
    var skip = (page - 1) * limit;
    var action = req.query.action;
    var studentId = req.query.studentId;
    var ip = req.query.ip;
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;

    // Build query filter
    var filter = {};
    if (action) filter.action = action;
    if (studentId) filter.studentId = studentId;
    if (ip) filter.ip = ip;
    if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Count total logs matching filter
    AccessLog.countDocuments(filter, function(err, total) {
        if (err) {
            console.error('Error counting logs:', err);
            return res.status(500).send('Error retrieving logs');
        }

        // Fetch logs with pagination
        AccessLog.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .exec(function(err, logs) {
                if (err) {
                    console.error('Error fetching logs:', err);
                    return res.status(500).send('Error retrieving logs');
                }

                res.render('accessLogs', {
                    title: 'Access Logs',
                    pageHeader: {
                        title: 'Access Logs - Security Monitoring'
                    },
                    pageFooter: {
                        explain: 'copyright'
                    },
                    logs: logs,
                    total: total,
                    page: page,
                    limit: limit,
                    totalPages: Math.ceil(total / limit),
                    filter: {
                        action: action,
                        studentId: studentId,
                        ip: ip,
                        startDate: startDate,
                        endDate: endDate
                    }
                });
            });
    });
};

/* GET 'Access Logs' API (JSON) */
module.exports.getLogsAPI = function(req, res) {
    var limit = parseInt(req.query.limit) || 100;
    var page = parseInt(req.query.page) || 1;
    var skip = (page - 1) * limit;
    var action = req.query.action;
    var studentId = req.query.studentId;
    var ip = req.query.ip;

    var filter = {};
    if (action) filter.action = action;
    if (studentId) filter.studentId = studentId;
    if (ip) filter.ip = ip;

    AccessLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(function(err, logs) {
            if (err) {
                return res.json({ success: false, error: err.message });
            }

            AccessLog.countDocuments(filter, function(err, total) {
                res.json({
                    success: true,
                    logs: logs,
                    total: total,
                    page: page,
                    limit: limit,
                    totalPages: Math.ceil(total / limit)
                });
            });
        });
};
