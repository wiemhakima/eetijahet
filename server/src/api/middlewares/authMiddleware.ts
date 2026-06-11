// ============================================================
// AUTH MIDDLEWARE — JWT protect + role authorization (TypeScript)
// ============================================================
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config';
import logger from '../../utils/logger';
import type { AuthRequest, JwtPayload, UserRole } from '../../types';

// Dynamically import User model to avoid circular deps
const getUserModel = () => require('../../models/User').default;

/**
 * Protect — verifies JWT and attaches user to req.user
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Not authorized — no token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      res.status(401).json({ success: false, error: 'Not authorized — invalid or expired token' });
      return;
    }

    const User = getUserModel();
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(`protect middleware error: ${(error as Error).message}`);
    next(error);
  }
};

/**
 * Authorize — restricts access to specific roles
 */
export const authorize = (...roles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authorized' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Role '${req.user.role}' is not authorized for this route`,
      });
      return;
    }
    next();
  };

/**
 * requireSuperAdmin — admin/super_admin only
 */
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    res.status(403).json({ success: false, error: 'Super admin access required' });
    return;
  }
  next();
};

/**
 * requireAgencyAdmin — agency_admin or admin
 */
export const requireAgencyAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authorized' });
    return;
  }
  const { role } = req.user;
  if (role === 'admin') { next(); return; }
  if (role === 'agency_admin' && req.user.agency) { next(); return; }
  res.status(403).json({ success: false, error: 'Agency admin access required' });
};

/**
 * requireAgencyAccess — agency_admin, gestionnaire_agency or admin
 */
export const requireAgencyAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authorized' });
    return;
  }
  const agencyRoles: UserRole[] = ['admin', 'agency_admin', 'gestionnaire_agency'];
  if (!agencyRoles.includes(req.user.role)) {
    res.status(403).json({ success: false, error: 'Agency access required' });
    return;
  }
  if (req.user.role !== 'admin' && !req.user.agency) {
    res.status(403).json({ success: false, error: 'No agency assigned to this account' });
    return;
  }
  next();
};

/**
 * requireMerchantSelf — merchant, agency_admin or admin
 */
export const requireMerchantSelf = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const allowed: UserRole[] = ['admin', 'agency_admin', 'gestionnaire_agency', 'merchant'];
  if (!req.user || !allowed.includes(req.user.role)) {
    res.status(403).json({ success: false, error: 'Merchant access required' });
    return;
  }
  next();
};
