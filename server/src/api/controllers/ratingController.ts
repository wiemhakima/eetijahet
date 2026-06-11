// ============================================================
// RATING CONTROLLER — TypeScript
// ============================================================
import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types';

const getRating   = () => require('../../models/Rating').default;
const getDelivery = () => require('../../models/Delivery').default;

// ─── POST /api/v1/ratings ────────────────────────────────────
export const createRating = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { deliveryId, stars, comment } = req.body;
    const Delivery = getDelivery();
    const Rating   = getRating();

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) { res.status(404).json({ success: false, error: 'Delivery not found' }); return; }

    const existing = await Rating.findOne({ delivery: deliveryId });
    if (existing) { res.status(400).json({ success: false, error: 'Delivery already rated' }); return; }

    const rating = await Rating.create({
      delivery: deliveryId,
      client:   req.user!._id,
      driver:   delivery.driver,
      stars,
      comment,
    });

    res.status(201).json({ success: true, data: rating });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/ratings/my-ratings ──────────────────────────
export const getMyRatings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Rating = getRating();
    const ratings = await Rating.find({ client: req.user!._id })
      .populate('delivery', 'trackingCode createdAt')
      .populate('driver', 'firstName lastName avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: ratings });
  } catch (error) { next(error); }
};

// ─── GET /api/v1/ratings/driver/:driverId ────────────────────
export const getDriverRatings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Rating = getRating();
    const ratings = await Rating.find({ driver: req.params.driverId })
      .populate('client', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    const avg = ratings.length
      ? ratings.reduce((sum: number, r: { stars: number }) => sum + r.stars, 0) / ratings.length
      : 0;

    res.json({ success: true, data: ratings, average: Math.round(avg * 10) / 10, count: ratings.length });
  } catch (error) { next(error); }
};
