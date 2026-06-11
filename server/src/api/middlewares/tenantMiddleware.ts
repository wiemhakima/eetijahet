// ============================================================
// TENANT MIDDLEWARE — Multi-tenant agency resolution (TypeScript)
// ============================================================
import { Response, NextFunction } from 'express';
import logger from '../../utils/logger';
import type { AuthRequest } from '../../types';

const getAgencyModel = () => require('../../models/Agency').default;

const ALLOWED_WHEN_EXPIRED = [
  '/api/v1/agencies/me',
  '/api/v1/subscriptions',
  '/api/v1/auth/logout',
];

/**
 * resolveTenant — attaches req.agency from req.user
 * Must run AFTER protect middleware
 */
export const resolveTenant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authorized' });
      return;
    }

    // Platform admins bypass tenant check
    if (['admin', 'super_admin'].includes(req.user.role)) {
      req.agency = null;
      next();
      return;
    }

    if (!req.user.agency) {
      res.status(403).json({
        success: false,
        error: 'Your account is not linked to any agency. Please contact support.',
      });
      return;
    }

    const Agency = getAgencyModel();
    const agency = await Agency.findById(req.user.agency).populate('subscription');

    if (!agency) {
      res.status(403).json({ success: false, error: 'Agency not found.' });
      return;
    }

    const isAllowed = ALLOWED_WHEN_EXPIRED.some((p) =>
      req.originalUrl.startsWith(p)
    );

    if (!isAllowed && !agency.isActive()) {
      res.status(403).json({
        success: false,
        error: 'Your agency subscription is inactive or your trial has expired. Please upgrade your plan.',
      });
      return;
    }

    req.agency = agency;
    next();
  } catch (error) {
    logger.error(`tenantMiddleware error: ${(error as Error).message}`);
    next(error);
  }
};

/**
 * requireAgencyAdmin — only agency_admin or admin
 */
export const requireAgencyAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !['agency_admin', 'admin'].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      error: 'Only agency administrators can perform this action.',
    });
    return;
  }
  next();
};

/**
 * requireAgencyAccess — agency_admin, gestionnaire_agency, or admin
 */
export const requireAgencyAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !['agency_admin', 'gestionnaire_agency', 'admin'].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      error: 'Accès réservé aux membres de l\'agence.',
    });
    return;
  }
  next();
};

/**
 * requireApiAccess — Pro/Enterprise plan only
 */
export const requireApiAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role === 'admin') { next(); return; }
  if (!req.agency || !req.agency.settings.apiAccess) {
    res.status(403).json({
      success: false,
      error: 'API access is not available on your current plan. Please upgrade to Pro or Enterprise.',
    });
    return;
  }
  next();
};
