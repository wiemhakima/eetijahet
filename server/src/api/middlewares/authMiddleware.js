/**
 * Authentication middleware
 */
const jwt = require('jsonwebtoken');
const config = require('../../config');
const User = require('../../models/User');

/**
 * Middleware to protect routes that require authentication
 * Verifies the JWT token from the Authorization header
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param {...String} roles - Roles allowed to access the route
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// ── SaaS role guards ──────────────────────────────────────────────────────────

exports.requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Super admin access required' });
  }
  next();
};

exports.requireAgencyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authorized' });
  }
  const { role } = req.user;
  if (role === 'admin') return next();
  const agencyAdminRoles = ['agency_admin'];
  if (agencyAdminRoles.includes(role) && req.user.agency) return next();
  return res.status(403).json({ success: false, error: 'Agency admin access required' });
};

exports.requireAgencyAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authorized' });
  }
  const { role } = req.user;
  const agencyRoles = ['admin', 'agency_admin', 'gestionnaire_agency'];
  if (!agencyRoles.includes(role)) {
    return res.status(403).json({ success: false, error: 'Agency access required' });
  }
  if (role !== 'admin' && !req.user.agency) {
    return res.status(403).json({ success: false, error: 'No agency assigned to this account' });
  }
  next();
};

exports.requireMerchantSelf = (req, res, next) => {
  const allowed = ['admin', 'agency_admin', 'gestionnaire_agency', 'merchant'];
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Merchant access required' });
  }
  next();
};
