const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header (handled by auth middleware first usually, but we check role here or assume req.user is populated)
    // This middleware assumes auth middleware has run and populated req.user

    if (!req.user) {
        return res.status(401).json({ msg: 'Authorization denied' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied: Admins only' });
    }

    next();
};
