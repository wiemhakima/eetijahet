// ============================================================
// MERCHANT CONTROLLER — TypeScript
// ============================================================
import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types';
import logger from '../../utils/logger';

const getMerchant = () => require('../../models/Merchant').default;
const getUser     = () => require('../../models/User').default;
const getDelivery = () => require('../../models/Delivery').default;

// ─── Agency: GET /api/v1/agencies/me/merchants ───────────────
export const getMerchants = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Merchant = getMerchant();
    const merchants = await Merchant.find({ agency: req.user!.agency })
      .populate('user', 'firstName lastName email phone avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: merchants });
  } catch (error) { next(error); }
};

// ─── Agency: POST /api/v1/agencies/me/merchants ──────────────
export const createMerchant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { storeName, email, firstName, lastName, phone, commission, address } = req.body;

    if (!storeName || !email || !firstName) {
      res.status(400).json({ success: false, error: 'storeName, email and firstName are required' });
      return;
    }

    const User = getUser();
    let user = await User.findOne({ email });

    if (!user) {
      const password = Math.random().toString(36).slice(-8);
      user = await User.create({
        firstName, lastName: lastName || '', email, phone,
        password, role: 'merchant', agency: req.user!.agency,
      });
    }

    const Merchant = getMerchant();
    const existing = await Merchant.findOne({ user: user._id });
    if (existing) { res.status(400).json({ success: false, error: 'Merchant already exists for this user' }); return; }

    const merchant = await Merchant.create({
      storeName, user: user._id, agency: req.user!.agency,
      commission: commission ?? 10, address, isActive: true,
    });

    logger.info(`Merchant created: ${storeName}`);
    res.status(201).json({ success: true, data: merchant });
  } catch (error) { next(error); }
};

// ─── Agency: GET /api/v1/agencies/me/merchants/:id ───────────
export const getMerchantById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Merchant = getMerchant();
    const merchant = await Merchant.findOne({ _id: req.params.id, agency: req.user!.agency })
      .populate('user', 'firstName lastName email phone avatar');
    if (!merchant) { res.status(404).json({ success: false, error: 'Merchant not found' }); return; }
    res.json({ success: true, data: merchant });
  } catch (error) { next(error); }
};

// ─── Agency: PUT /api/v1/agencies/me/merchants/:id ───────────
export const updateMerchant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Merchant = getMerchant();
    const merchant = await Merchant.findOneAndUpdate(
      { _id: req.params.id, agency: req.user!.agency },
      req.body, { new: true, runValidators: true }
    );
    if (!merchant) { res.status(404).json({ success: false, error: 'Merchant not found' }); return; }
    res.json({ success: true, data: merchant });
  } catch (error) { next(error); }
};

// ─── Agency: DELETE /api/v1/agencies/me/merchants/:id ────────
export const deleteMerchant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Merchant = getMerchant();
    const merchant = await Merchant.findOneAndDelete({ _id: req.params.id, agency: req.user!.agency });
    if (!merchant) { res.status(404).json({ success: false, error: 'Merchant not found' }); return; }
    res.json({ success: true, message: 'Merchant deleted' });
  } catch (error) { next(error); }
};

// ─── Merchant: GET /api/v1/merchant/profile ──────────────────
export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Merchant = getMerchant();
    const merchant = await Merchant.findOne({ user: req.user!._id })
      .populate('agency', 'name logo phone');
    if (!merchant) { res.status(404).json({ success: false, error: 'Merchant profile not found' }); return; }
    res.json({ success: true, data: merchant });
  } catch (error) { next(error); }
};

// ─── Merchant: GET /api/v1/merchant/stats ────────────────────
export const getMyStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Merchant = getMerchant();
    const merchant = await Merchant.findOne({ user: req.user!._id });
    if (!merchant) { res.status(404).json({ success: false, error: 'Merchant not found' }); return; }
    res.json({ success: true, data: merchant.stats || { totalOrders: 0, totalRevenue: 0, totalCommission: 0 } });
  } catch (error) { next(error); }
};

// ─── Merchant: GET /api/v1/merchant/orders ───────────────────
export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const Delivery = getDelivery();
    const Merchant = getMerchant();
    const merchant = await Merchant.findOne({ user: req.user!._id });
    if (!merchant) { res.status(404).json({ success: false, error: 'Merchant not found' }); return; }

    const [orders, total] = await Promise.all([
      Delivery.find({ merchant: merchant._id })
        .populate('client', 'firstName lastName phone')
        .populate('driver', 'firstName lastName phone')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit).limit(+limit),
      Delivery.countDocuments({ merchant: merchant._id }),
    ]);

    res.json({ success: true, data: orders, total, page: +page, limit: +limit });
  } catch (error) { next(error); }
};
