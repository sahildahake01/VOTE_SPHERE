const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. ${req.user.role} role cannot access this resource`
            });
        }
        next();
    };
};

module.exports = { requireRole };