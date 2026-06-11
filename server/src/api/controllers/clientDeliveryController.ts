// ============================================================
// CLIENT DELIVERY CONTROLLER — TypeScript
// ============================================================
import { Response, NextFunction } from 'express';
import axios from 'axios';
import logger from '../../utils/logger';
import type { AuthRequest } from '../../types';

const getDelivery      = () => require('../../models/Delivery').default;
const getEmailService  = () => require('../../services/emailService');

const CORE_URL = process.env.ROUTING_SERVER_URL || 'http://127.0.0.1:8050';

// ─── Helpers ─────────────────────────────────────────────────
const generateOrderId = (): string => {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD-${ts}-${rnd}`;
};

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calcPrice = (distanceKm: number): number =>
  Math.round(Math.max(1.5, 1.5 + distanceKm * 0.18) * 1000) / 1000;

// ─── POST /api/v1/deliveries/estimate ────────────────────────
export const estimateDelivery = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;

    if (pickupLat === undefined || pickupLng === undefined || dropoffLat === undefined || dropoffLng === undefined) {
      res.status(400).json({ success: false, error: 'pickupLat, pickupLng, dropoffLat, dropoffLng are required' });
      return;
    }

    const pLat = parseFloat(pickupLat), pLng = parseFloat(pickupLng);
    const dLat = parseFloat(dropoffLat), dLng = parseFloat(dropoffLng);

    let distance_km: number, eta_minutes: number, fallback = false;

    try {
      const coreRes = await axios.post(`${CORE_URL}/predict_route`, { start: [pLat, pLng], end: [dLat, dLng] }, { timeout: 10000 });
      distance_km = coreRes.data.distance / 1000;
      eta_minutes = coreRes.data.eta;
    } catch (err) {
      logger.warn(`Core engine unreachable (${(err as Error).message}), using Haversine fallback`);
      distance_km = haversineKm(pLat, pLng, dLat, dLng);
      eta_minutes  = Math.round((distance_km / 40) * 60);
      fallback     = true;
    }

    res.json({
      success: true,
      data: {
        distance_km:    Math.round(distance_km * 10) / 10,
        eta_minutes:    Math.round(eta_minutes),
        estimatedPrice: calcPrice(distance_km),
        fallback,
      },
    });
  } catch (error) {
    logger.error(`estimateDelivery error: ${(error as Error).message}`);
    next(error);
  }
};

// ─── POST /api/v1/deliveries ─────────────────────────────────
export const createDelivery = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      pickupLat, pickupLng, pickupLabel,
      dropoffLat, dropoffLng, dropoffLabel,
      packageType, notes, desiredDate,
      estimatedPrice, distance_km, eta_minutes,
      agencyId,
    } = req.body;

    if (pickupLat === undefined || pickupLng === undefined || dropoffLat === undefined || dropoffLng === undefined) {
      res.status(400).json({ success: false, error: 'Pickup and dropoff coordinates are required' });
      return;
    }

    const resolvedAgency = req.user?.agency || agencyId;
    if (!resolvedAgency) {
      res.status(400).json({ success: false, error: 'agencyId is required for marketplace orders.' });
      return;
    }

    const Delivery = getDelivery();
    const delivery = await Delivery.create({
      orderId:       generateOrderId(),
      agency:        resolvedAgency,
      client:        req.user!._id,
      pickupLat:     parseFloat(pickupLat),
      pickupLng:     parseFloat(pickupLng),
      pickupLabel:   pickupLabel  || '',
      dropoffLat:    parseFloat(dropoffLat),
      dropoffLng:    parseFloat(dropoffLng),
      dropoffLabel:  dropoffLabel || '',
      packageType:   packageType  || 'small',
      notes:         notes        || '',
      desiredDate:   desiredDate  ? new Date(desiredDate) : undefined,
      estimatedPrice,
      distance_km,
      eta_minutes,
      clientStatus:  'pending',
      status:        'going_to_pickup',
    });

    if (req.user?.email && delivery.trackingCode) {
      const clientName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Client';
      getEmailService().sendTrackingLink(req.user.email, clientName, delivery.trackingCode).catch(() => {});
    }

    res.status(201).json({ success: true, data: delivery });
  } catch (error) {
    logger.error(`createDelivery error: ${(error as Error).message}`);
    next(error);
  }
};

// ─── GET /api/v1/deliveries ──────────────────────────────────
export const getDeliveries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: Record<string, unknown> = { client: req.user!._id };
    if (status) filter.clientStatus = status;

    const Delivery = getDelivery();
    const [deliveries, total] = await Promise.all([
      Delivery.find(filter)
        .populate('driver', 'firstName lastName phone avatar driverStatus')
        .populate('agency', 'name logo')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Delivery.countDocuments(filter),
    ]);

    res.json({ success: true, data: deliveries, total, page: +page, limit: +limit });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/v1/deliveries/:id ──────────────────────────────
export const getDeliveryById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Delivery = getDelivery();
    const delivery = await Delivery.findOne({ _id: req.params.id, client: req.user!._id })
      .populate('driver', 'firstName lastName phone avatar driverStatus lastLat lastLng')
      .populate('agency', 'name logo phone');

    if (!delivery) {
      res.status(404).json({ success: false, error: 'Delivery not found' });
      return;
    }

    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/v1/deliveries/:id/cancel ───────────────────────
export const cancelDelivery = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Delivery = getDelivery();
    const delivery = await Delivery.findOne({ _id: req.params.id, client: req.user!._id });

    if (!delivery) {
      res.status(404).json({ success: false, error: 'Delivery not found' });
      return;
    }

    const cancellable = ['pending', 'broadcasting'];
    if (!cancellable.includes(delivery.clientStatus)) {
      res.status(400).json({ success: false, error: 'Delivery cannot be cancelled at this stage' });
      return;
    }

    delivery.clientStatus = 'cancelled';
    delivery.status = 'failed';
    await delivery.save();

    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};
