// ============================================================
// NOTIFICATION CONTROLLER — TypeScript
// ============================================================
import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types';

const getNotification = () => require('../../models/Notification').default;

// ─── GET /api/v1/notifications ───────────────────────────────
export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Notification = getNotification();
    const notifications = await Notification.find({
      $or: [{ user: req.user!._id }, { global: true }],
    }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: notifications });
  } catch (error) { next(error); }
};

// ─── POST /api/v1/notifications ──────────────────────────────
export const createNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, message, type, userId } = req.body;
    const Notification = getNotification();
    const notification = await Notification.create({
      title, message, type: type || 'info',
      user: userId || req.user!._id,
      global: false,
    });
    res.status(201).json({ success: true, data: notification });
  } catch (error) { next(error); }
};

// ─── PUT /api/v1/notifications/read-all ──────────────────────
export const markAllRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Notification = getNotification();
    await Notification.updateMany(
      { $or: [{ user: req.user!._id }, { global: true }], isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
};

// ─── PUT /api/v1/notifications/:id/read ──────────────────────
export const markOneRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Notification = getNotification();
    const notification = await Notification.findByIdAndUpdate(
      req.params.id, { isRead: true }, { new: true }
    );
    if (!notification) { res.status(404).json({ success: false, error: 'Notification not found' }); return; }
    res.json({ success: true, data: notification });
  } catch (error) { next(error); }
};

// ─── DELETE /api/v1/notifications/:id ────────────────────────
export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Notification = getNotification();
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) { next(error); }
};
