// ============================================================
// AGENCY CONTROLLER — TypeScript
// ============================================================
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../../config';
import logger from '../../utils/logger';
import type { AuthRequest } from '../../types';

const getAgency      = () => require('../../models/Agency').default;
const getUser        = () => require('../../models/User').default;
const getDelivery    = () => require('../../models/Delivery').default;
const getSubscription= () => require('../../models/Subscription').default;
const getNotification= () => require('../../models/Notification').default;
const getApiSettings = () => require('../../models/UserApiSettings').default;
const { getPlan, planToAgencySettings } = require('../../config/plans');

const generateToken = (user: { _id: unknown; role: string; agency?: unknown }): string =>
  jwt.sign({ id: user._id, role: user.role, agencyId: user.agency }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

// ─── GET /api/v1/agencies/public ─────────────────────────────
export const getPublicAgencies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { zone } = req.query;
    const filter: Record<string, unknown> = { status: 'active' };
    if (zone) filter.coverageZones = zone;

    const Agency = getAgency();
    const agencies = await Agency.find(filter)
      .select('name nameAr logo priceBase coverageZones rating ratingCount currency slug')
      .sort({ rating: -1, createdAt: -1 })
      .limit(50);

    res.json({ success: true, count: agencies.length, data: agencies });
  } catch (error) { next(error); }
};

// ─── POST /api/v1/agencies/register ──────────────────────────
export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { agencyName, email, password, firstName, lastName, phone, plan = 'basic' } = req.body;

    if (!agencyName || !email || !password || !firstName) {
      res.status(400).json({ success: false, error: 'agencyName, email, password and firstName are required.' });
      return;
    }

    try { getPlan(plan); } catch {
      res.status(400).json({ success: false, error: `Invalid plan: ${plan}. Choose basic, medium or pro.` });
      return;
    }

    const User = getUser();
    if (await User.findOne({ email })) {
      res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }

    const ownerId = new mongoose.Types.ObjectId();
    const ApiSettings = getApiSettings();
    const apiSettings = await ApiSettings.create({ totalCredits: 0, usedCredits: 0 });

    const Agency = getAgency();
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const agency = await Agency.create({
      name: agencyName, email, phone, owner: ownerId,
      status: 'trial', trialEndsAt,
      settings: planToAgencySettings(plan),
    });

    const owner = await User.create({
      _id: ownerId, firstName, lastName: lastName || '', email, password,
      role: 'agency_admin', agency: agency._id, activeApiSettings: apiSettings._id,
    });

    const Subscription = getSubscription();
    const subscription = await Subscription.create({
      agency: agency._id, plan, billing: 'monthly', status: 'trialing',
      currentPeriodStart: new Date(), currentPeriodEnd: trialEndsAt,
    });

    agency.subscription = subscription._id;
    await agency.save();

    const Notification = getNotification();
    await Notification.create({
      title: 'Welcome to Eetijahet!',
      message: `Your agency ${agencyName} has been created. Trial ends ${trialEndsAt.toLocaleDateString()}.`,
      type: 'success', user: owner._id, global: false,
    });

    const token = generateToken(owner);
    owner.password = undefined;

    logger.info(`Agency registered: ${agencyName} (${email})`);
    res.status(201).json({ success: true, token, data: { agency, owner } });
  } catch (error) {
    logger.error(`register error: ${(error as Error).message}`);
    next(error);
  }
};

// ─── GET /api/v1/agencies/me ─────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Agency = getAgency();
    const agency = await Agency.findById(req.user!.agency).populate('subscription').populate('owner', 'firstName lastName email');
    if (!agency) { res.status(404).json({ success: false, error: 'Agency not found' }); return; }
    res.json({ success: true, data: agency });
  } catch (error) { next(error); }
};

// ─── PUT /api/v1/agencies/me ─────────────────────────────────
export const updateMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allowed = ['name', 'nameAr', 'phone', 'address', 'logo', 'currency', 'priceBase', 'coverageZones'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    const Agency = getAgency();
    const agency = await Agency.findByIdAndUpdate(req.user!.agency, updates, { new: true, runValidators: true });
    res.json({ success: true, data: agency });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/agencies/me/drivers ─────────────────────────
export const getDrivers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const User = getUser();
    const drivers = await User.find({ agency: req.user!.agency, role: 'driver' })
      .select('firstName lastName email phone avatar driverStatus createdAt');
    res.json({ success: true, data: drivers });
  } catch (error) { next(error); }
};

// ─── POST /api/v1/agencies/me/drivers ────────────────────────
export const inviteDriver = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, firstName, lastName, phone } = req.body;
    if (!email || !firstName) {
      res.status(400).json({ success: false, error: 'email and firstName are required' });
      return;
    }

    const User = getUser();
    if (await User.findOne({ email })) {
      res.status(400).json({ success: false, error: 'Email already in use' });
      return;
    }

    const password = Math.random().toString(36).slice(-8);
    const driver = await User.create({
      firstName, lastName: lastName || '', email, phone,
      password, role: 'driver', agency: req.user!.agency,
      driverStatus: 'offline',
    });

    driver.password = undefined;
    logger.info(`Driver invited: ${email} → agency ${req.user!.agency}`);
    res.status(201).json({ success: true, data: driver, tempPassword: password });
  } catch (error) { next(error); }
};

// ─── PUT /api/v1/agencies/me/drivers/:driverId ───────────────
export const updateDriver = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const User = getUser();
    const driver = await User.findOneAndUpdate(
      { _id: req.params.driverId, agency: req.user!.agency, role: 'driver' },
      req.body, { new: true, runValidators: true }
    );
    if (!driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
    res.json({ success: true, data: driver });
  } catch (error) { next(error); }
};

// ─── DELETE /api/v1/agencies/me/drivers/:driverId ────────────
export const removeDriver = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const User = getUser();
    const driver = await User.findOneAndDelete({ _id: req.params.driverId, agency: req.user!.agency, role: 'driver' });
    if (!driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
    res.json({ success: true, message: 'Driver removed' });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/agencies/me/drivers/available ───────────────
export const getAvailableDrivers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const User = getUser();
    const drivers = await User.find({ agency: req.user!.agency, role: 'driver', driverStatus: 'available' })
      .select('firstName lastName phone avatar driverStatus lastLat lastLng');
    res.json({ success: true, data: drivers });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/agencies/me/clients ─────────────────────────
export const getClients = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const User = getUser();
    const clients = await User.find({ agency: req.user!.agency, role: 'user' })
      .select('firstName lastName email phone avatar createdAt');
    res.json({ success: true, data: clients });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/agencies/me/deliveries ──────────────────────
export const getAgencyDeliveries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: Record<string, unknown> = { agency: req.user!.agency };
    if (status) filter.clientStatus = status;

    const Delivery = getDelivery();
    const [deliveries, total] = await Promise.all([
      Delivery.find(filter)
        .populate('client', 'firstName lastName phone')
        .populate('driver', 'firstName lastName phone driverStatus')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Delivery.countDocuments(filter),
    ]);

    res.json({ success: true, data: deliveries, total, page: +page, limit: +limit });
  } catch (error) { next(error); }
};

// ─── PUT /api/v1/agencies/me/deliveries/:id/assign ───────────
export const assignDriver = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { driverId } = req.body;
    if (!driverId) { res.status(400).json({ success: false, error: 'driverId is required' }); return; }

    const Delivery = getDelivery();
    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.deliveryId, agency: req.user!.agency },
      { driver: driverId, clientStatus: 'accepted' },
      { new: true }
    );

    if (!delivery) { res.status(404).json({ success: false, error: 'Delivery not found' }); return; }
    res.json({ success: true, data: delivery });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/agencies/me/stats ───────────────────────────
export const getStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Delivery = getDelivery();
    const User = getUser();

    const [totalDeliveries, deliveredCount, pendingCount, driversCount] = await Promise.all([
      Delivery.countDocuments({ agency: req.user!.agency }),
      Delivery.countDocuments({ agency: req.user!.agency, clientStatus: 'delivered' }),
      Delivery.countDocuments({ agency: req.user!.agency, clientStatus: { $in: ['pending', 'broadcasting', 'accepted'] } }),
      User.countDocuments({ agency: req.user!.agency, role: 'driver' }),
    ]);

    res.json({
      success: true,
      data: { totalDeliveries, deliveredCount, pendingCount, driversCount },
    });
  } catch (error) { next(error); }
};
