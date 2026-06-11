// ============================================================
// AUTH CONTROLLER — TypeScript
// ============================================================
import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../config';
import logger from '../../utils/logger';
import type { AuthRequest } from '../../types';

// Models
const getUserModel    = () => require('../../models/User').default;
const getApiSettings  = () => require('../../models/UserApiSettings').default;
const getNotification = () => require('../../models/Notification').default;
const getAgency       = () => require('../../models/Agency').default;

const generateToken = (user: { _id: unknown; role: string; agency?: unknown }): string =>
  jwt.sign(
    { id: user._id, role: user.role, agencyId: user.agency || null },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

// ─── POST /api/v1/auth/signup ────────────────────────────────
export const signup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, email, password, company, avatar, agreeMarketing, role } = req.body;

    const User = getUserModel();
    const UserApiSettings = getApiSettings();
    const Notification = getNotification();

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, error: 'Email already in use' });
      return;
    }

    const apiSettings = await UserApiSettings.create({
      totalCredits: 1000,
      usedCredits: 0,
      totalRequests: 0,
      successfulRequestsCount: 0,
      failedRequestsCount: 0,
      requestsPerMinute: 500,
      requestsPerHour: 30000,
      requestsPerDay: 72000,
      concurrentRequests: 100,
    });

    const allowedRoles = ['user', 'developer'];
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      company,
      avatar,
      agreeMarketing,
      role: allowedRoles.includes(role) ? role : 'user',
      activeApiSettings: apiSettings._id,
    });

    const token = generateToken(user);
    user.password = undefined;

    await Notification.create({
      title: 'Welcome to Eetijahet!',
      message: `Hello ${firstName}, your account has been created successfully.`,
      type: 'success',
      user: user._id,
      global: false,
    });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({ success: true, token, data: user });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/v1/auth/login ─────────────────────────────────
export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const User = getUserModel();
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user);
    user.password = undefined;

    logger.info(`User logged in: ${email}`);
    res.json({ success: true, token, data: user });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/v1/auth/me ─────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const User = getUserModel();
    const user = await User.findById(req.user!._id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/v1/auth/profile ────────────────────────────────
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, company, agreeMarketing } = req.body;
    const User = getUserModel();

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { firstName, lastName, company, agreeMarketing },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/v1/auth/password ───────────────────────────────
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const User = getUserModel();

    const user = await User.findById(req.user!._id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user);
    res.json({ success: true, token, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/v1/auth/logout ────────────────────────────────
export const logout = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// ─── POST /api/v1/auth/forgot-password ───────────────────────
export const forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const User = getUserModel();

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save({ validateBeforeSave: false });

    // TODO: send email with resetToken
    logger.info(`Password reset requested for: ${email}`);

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/v1/auth/reset-password/:token ─────────────────
export const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const User = getUserModel();

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
      return;
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const token = generateToken(user);
    res.json({ success: true, token, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};
