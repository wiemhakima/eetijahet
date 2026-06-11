// ============================================================
// SUBSCRIPTION CONTROLLER — TypeScript
// ============================================================
import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types';
import logger from '../../utils/logger';

const getSubscription = () => require('../../models/Subscription').default;
const getAgency       = () => require('../../models/Agency').default;
const { getPlan, planToAgencySettings, PLANS } = require('../../config/plans');

// ─── GET /api/v1/subscriptions/plans ─────────────────────────
export const getPlans = (_req: AuthRequest, res: Response): void => {
  res.json({ success: true, data: PLANS });
};

// ─── POST /api/v1/subscriptions ──────────────────────────────
export const subscribe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { plan, billing = 'monthly' } = req.body;
    try { getPlan(plan); } catch {
      res.status(400).json({ success: false, error: `Invalid plan: ${plan}` });
      return;
    }

    const Subscription = getSubscription();
    const Agency = getAgency();

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (billing === 'annual' ? 12 : 1));

    let subscription = await Subscription.findOne({ agency: req.user!.agency });
    if (subscription) {
      subscription.plan = plan;
      subscription.billing = billing;
      subscription.status = 'active';
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = periodEnd;
      subscription.cancelAtPeriodEnd = false;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        agency: req.user!.agency, plan, billing, status: 'active',
        currentPeriodStart: new Date(), currentPeriodEnd: periodEnd,
      });
    }

    await Agency.findByIdAndUpdate(req.user!.agency, {
      subscription: subscription._id,
      settings: planToAgencySettings(plan),
    });

    logger.info(`Agency ${req.user!.agency} subscribed to ${plan}`);
    res.json({ success: true, data: subscription });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/subscriptions/current ───────────────────────
export const getCurrent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Subscription = getSubscription();
    const subscription = await Subscription.findOne({ agency: req.user!.agency });
    if (!subscription) { res.status(404).json({ success: false, error: 'No active subscription' }); return; }
    res.json({ success: true, data: subscription });
  } catch (error) { next(error); }
};

// ─── PUT /api/v1/subscriptions/current ───────────────────────
export const changePlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { plan, billing } = req.body;
    const Subscription = getSubscription();
    const Agency = getAgency();

    const subscription = await Subscription.findOneAndUpdate(
      { agency: req.user!.agency },
      { plan, ...(billing && { billing }) },
      { new: true }
    );

    if (!subscription) { res.status(404).json({ success: false, error: 'No subscription found' }); return; }

    await Agency.findByIdAndUpdate(req.user!.agency, { settings: planToAgencySettings(plan) });

    res.json({ success: true, data: subscription });
  } catch (error) { next(error); }
};

// ─── DELETE /api/v1/subscriptions/current ────────────────────
export const cancelSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Subscription = getSubscription();
    const subscription = await Subscription.findOneAndUpdate(
      { agency: req.user!.agency },
      { cancelAtPeriodEnd: true },
      { new: true }
    );
    if (!subscription) { res.status(404).json({ success: false, error: 'No subscription found' }); return; }
    res.json({ success: true, data: subscription, message: 'Subscription will be cancelled at period end' });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/subscriptions/invoices ──────────────────────
export const getInvoices = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Subscription = getSubscription();
    const subscription = await Subscription.findOne({ agency: req.user!.agency }).select('invoices');
    res.json({ success: true, data: subscription?.invoices || [] });
  } catch (error) { next(error); }
};
