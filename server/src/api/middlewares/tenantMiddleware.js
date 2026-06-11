/**
 * Tenant middleware — resolves and attaches the Agency to req.agency.
 *
 * Must run AFTER authMiddleware.protect so req.user is already populated.
 *
 * Usage:
 *   router.use('/some-route', authMiddleware.protect, tenantMiddleware.resolveTenant, handler);
 *
 * After this middleware:
 *   req.agency  — the full Agency document (with subscription populated)
 *   req.user    — the authenticated User (unchanged)
 */
const Agency = require('../../models/Agency');
const logger = require('../../utils/logger');

/**
 * Resolves the agency from the authenticated user and attaches it to the request.
 * Super-admins bypass the tenant check (they operate across all agencies).
 */
exports.resolveTenant = async (req, res, next) => {
  try {
    // Platform admins are not bound to any single agency
    if (req.user.role === 'admin') {
      req.agency = null;
      return next();
    }

    if (!req.user.agency) {
      return res.status(403).json({
        success: false,
        error: 'Your account is not linked to any agency. Please contact support.',
      });
    }

    const agency = await Agency.findById(req.user.agency).populate('subscription');

    if (!agency) {
      return res.status(403).json({
        success: false,
        error: 'Agency not found.',
      });
    }

    const ALLOWED_WHEN_EXPIRED = [
      '/api/v1/agencies/me',
      '/api/v1/subscriptions',
      '/api/v1/auth/logout',
    ];
    const isAllowed = ALLOWED_WHEN_EXPIRED.some(p => req.originalUrl.startsWith(p));

    if (!isAllowed && !agency.isActive()) {
      return res.status(403).json({
        success: false,
        error: 'Your agency subscription is inactive or your trial has expired. Please upgrade your plan.',
      });
    }

    req.agency = agency;
    next();
  } catch (error) {
    logger.error(`tenantMiddleware error: ${error.message}`);
    next(error);
  }
};

/**
 * Restricts access to agency_admin or admin roles only.
 * Use after resolveTenant.
 */
exports.requireAgencyAdmin = (req, res, next) => {
  if (!['agency_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Only agency administrators can perform this action.',
    });
  }
  next();
};

/**
 * Allows both agency_admin and gestionnaire_agency roles.
 * Use for routes that both agency staff types should access (merchants, deliveries, drivers, stats, finances).
 */
exports.requireAgencyAccess = (req, res, next) => {
  if (!['agency_admin', 'gestionnaire_agency', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux membres de l\'agence.',
    });
  }
  next();
};

/**
 * Ensures the agency has API access enabled (Pro / Enterprise plans only).
 * Use after resolveTenant.
 */
exports.requireApiAccess = (req, res, next) => {
  if (req.user.role === 'admin') return next();

  if (!req.agency || !req.agency.settings.apiAccess) {
    return res.status(403).json({
      success: false,
      error: 'API access is not available on your current plan. Please upgrade to Pro or Enterprise.',
    });
  }
  next();
};
