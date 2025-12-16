var mongoose = require('mongoose');
var AccessLog = mongoose.model('AccessLog');

/**
 * Get client IP address from request
 * Handles proxies and load balancers
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.ip ||
           'unknown';
}

/**
 * Log access to database
 */
function logAccess(req, action, additionalData) {
    var ip = getClientIP(req);
    var studentId = [];
    var gameName = null;
    var objectId = null;

    // Extract student ID from request body or params
    if (req.body) {
        if (req.body.id) {
            studentId = Array.isArray(req.body.id) ? req.body.id : [req.body.id];
        }
        if (req.body.game_title) {
            gameName = req.body.game_title;
        }
    }

    // Extract from params if available
    if (req.params && req.params.objid) {
        objectId = req.params.objid;
    }
    if (req.params && req.params.objectid) {
        objectId = req.params.objectid;
    }

    var logEntry = new AccessLog({
        timestamp: new Date(),
        ip: ip,
        studentId: studentId,
        action: action,
        endpoint: req.originalUrl || req.url,
        method: req.method,
        userAgent: req.headers['user-agent'] || 'unknown',
        gameName: gameName,
        objectId: objectId,
        additionalInfo: additionalData || {}
    });

    logEntry.save(function(err) {
        if (err) {
            console.error('[AccessLog] Failed to save log:', err.message);
        } else {
            console.log('[AccessLog] ' + action + ' - IP: ' + ip + ' - Student ID: ' + studentId.join(','));
        }
    });
}

/**
 * Middleware to automatically log certain requests
 */
function accessLoggerMiddleware(action) {
    return function(req, res, next) {
        logAccess(req, action);
        next();
    };
}

module.exports = {
    logAccess: logAccess,
    getClientIP: getClientIP,
    middleware: accessLoggerMiddleware
};
