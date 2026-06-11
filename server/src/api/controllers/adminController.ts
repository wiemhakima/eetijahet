// ============================================================
// ADMIN CONTROLLER — TypeScript
// ============================================================
import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types';
import logger from '../../utils/logger';

const getUser         = () => require('../../models/User').default;
const getDelivery     = () => require('../../models/Delivery').default;
const getNotification = () => require('../../models/Notification').default;
const getAgency       = () => require('../../models/Agency').default;

// ─── GET /api/v1/admin/stats ─────────────────────────────────
export const getStats = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const User = getUser(); const Delivery = getDelivery(); const Agency = getAgency();

    const [totalUsers, totalDeliveries, totalAgencies, deliveredToday] = await Promise.all([
      User.countDocuments(),
      Delivery.countDocuments(),
      Agency.countDocuments(),
      Delivery.countDocuments({
        clientStatus: 'delivered',
        updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    res.json({ success: true, data: { totalUsers, totalDeliveries, totalAgencies, deliveredToday } });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/admin/users ─────────────────────────────────
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName:  { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
    ];

    const User = getUser();
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 })
        .skip((+page - 1) * +limit).limit(+limit),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: users, total, page: +page, limit: +limit });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/admin/users/:id ─────────────────────────────
export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const User = getUser();
    const user = await User.findById(req.params.id).select('-password').populate('agency', 'name');
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

// ─── PUT /api/v1/admin/users/:id ─────────────────────────────
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { password: _p, ...updates } = req.body; void _p;
    const User = getUser();
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

// ─── PATCH /api/v1/admin/users/:id/role ──────────────────────
export const changeRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body;
    const User = getUser();
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    logger.info(`Role changed: ${user.email} → ${role}`);
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

// ─── DELETE /api/v1/admin/users/:id ──────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const User = getUser();
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, message: 'User deleted' });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/admin/deliveries ────────────────────────────
export const getDeliveries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.clientStatus = status;

    const Delivery = getDelivery();
    const [deliveries, total] = await Promise.all([
      Delivery.find(filter)
        .populate('client', 'firstName lastName email')
        .populate('driver', 'firstName lastName phone')
        .populate('agency', 'name')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit).limit(+limit),
      Delivery.countDocuments(filter),
    ]);

    res.json({ success: true, data: deliveries, total, page: +page, limit: +limit });
  } catch (error) { next(error); }
};

// ─── POST /api/v1/admin/notifications/broadcast ──────────────
export const broadcastNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, message, type } = req.body;
    const Notification = getNotification();
    const notification = await Notification.create({ title, message, type: type || 'info', global: true });
    res.status(201).json({ success: true, data: notification });
  } catch (error) { next(error); }
};

// ─── POST /api/v1/admin/users/:id/impersonate ────────────────
export const impersonate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jwt = require('jsonwebtoken');
    const User = getUser();
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }

    const token = jwt.sign(
      { id: user._id, role: user.role, agencyId: user.agency || null, impersonatedBy: req.user!._id },
      require('../../config').default.jwt.secret,
      { expiresIn: '1h' }
    );

    logger.warn(`Admin ${req.user!.email} impersonating ${user.email}`);
    res.json({ success: true, token, data: user });
  } catch (error) { next(error); }
};
