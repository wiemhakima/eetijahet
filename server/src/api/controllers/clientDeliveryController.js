/**
 * Client Delivery Controller
 * JWT-authenticated routes for client users to manage their deliveries.
 */
const axios    = require('axios');
const Delivery = require('../../models/Delivery');
const logger   = require('../../utils/logger');
const emailService = require('../../services/emailService');
const rv = require('../../views/responseView');
const deliveryView = require('../../views/deliveryView');

const CORE_URL = process.env.ROUTING_SERVER_URL || 'http://127.0.0.1:8050';

// ── Helpers ──────────────────────────────────────────────────────────────────

const generateOrderId = () => {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD-${ts}-${rnd}`;
};

const haversineKm = (lat1, lng1, lat2, lng2) => {
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

const calcPrice = (distanceKm) =>
  Math.round(Math.max(1.5, 1.5 + distanceKm * 0.18) * 1000) / 1000;

// ── POST /api/v1/deliveries/estimate ─────────────────────────────────────────

exports.estimateDelivery = async (req, res, next) => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;

    if (
      pickupLat === undefined || pickupLng === undefined ||
      dropoffLat === undefined || dropoffLng === undefined
    ) {
      return rv.send(res, deliveryView.badRequest('pickupLat, pickupLng, dropoffLat, dropoffLng are required'));
    }

    const pLat = parseFloat(pickupLat);
    const pLng = parseFloat(pickupLng);
    const dLat = parseFloat(dropoffLat);
    const dLng = parseFloat(dropoffLng);

    let distance_km, eta_minutes, fallback = false;

    try {
      const coreRes = await axios.post(
        `${CORE_URL}/predict_route`,
        { start: [pLat, pLng], end: [dLat, dLng] },
        { timeout: 10000 }
      );
      // Flask returns { distance: meters, eta: minutes }
      distance_km = coreRes.data.distance / 1000;
      eta_minutes = coreRes.data.eta;
    } catch (err) {
      logger.warn(`Core engine unreachable for estimate (${err.message}), using Haversine fallback`);
      distance_km = haversineKm(pLat, pLng, dLat, dLng);
      eta_minutes  = Math.round((distance_km / 40) * 60);
      fallback     = true;
    }

    return rv.send(res, rv.success({
      data: {
        distance_km:    Math.round(distance_km * 10) / 10,
        eta_minutes:    Math.round(eta_minutes),
        estimatedPrice: calcPrice(distance_km),
        fallback,
      },
    }));
  } catch (error) {
    logger.error(`estimateDelivery error: ${error.message}`);
    next(error);
  }
};

// ── POST /api/v1/deliveries ───────────────────────────────────────────────────

exports.createDelivery = async (req, res, next) => {
  try {
    const {
      pickupLat, pickupLng, pickupLabel,
      dropoffLat, dropoffLng, dropoffLabel,
      packageType, notes, desiredDate,
      estimatedPrice, distance_km, eta_minutes,
      agencyId, // marketplace clients pass this explicitly
    } = req.body;

    if (
      pickupLat === undefined || pickupLng === undefined ||
      dropoffLat === undefined || dropoffLng === undefined
    ) {
      return rv.send(res, deliveryView.badRequest('Pickup and dropoff coordinates are required'));
    }

    // Resolve agency: use user's own agency (driver/agency flow) or the one passed by a marketplace client
    const resolvedAgency = req.user.agency || agencyId;
    if (!resolvedAgency) {
      return rv.send(res, deliveryView.badRequest('agencyId is required for marketplace orders.'));
    }

    const delivery = await Delivery.create({
      orderId:       generateOrderId(),
      agency:        resolvedAgency,
      client:        req.user._id,
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

    // Send tracking email to client (non-blocking)
    if (req.user.email && delivery.trackingCode) {
      const clientName = `${req.user.firstName || ''}${req.user.lastName ? ' ' + req.user.lastName : ''}`.trim() || 'Client';
      emailService.sendTrackingLink(req.user.email, clientName, delivery.trackingCode).catch(() => {});
    }

    return rv.send(res, deliveryView.created(delivery));
  } catch (error) {
    logger.error(`createDelivery error: ${error.message}`);
    next(error);
  }
};

// ── GET /api/v1/deliveries ────────────────────────────────────────────────────

exports.getDeliveries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { client: req.user._id };
    if (status) filter.clientStatus = status;

    const total      = await Delivery.countDocuments(filter);
    const deliveries = await Delivery.find(filter)
      .populate('driver', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return rv.send(res, deliveryView.list(deliveries, { total, page: parseInt(page), limit: parseInt(limit) }));
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/deliveries/:id ────────────────────────────────────────────────

exports.getDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({
      _id: req.params.id,
      client: req.user._id,
    }).populate('driver', 'firstName lastName phone');
    if (!delivery) {
      return rv.send(res, deliveryView.notFound());
    }
    return rv.send(res, deliveryView.one(delivery));
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/v1/deliveries/:id/cancel ────────────────────────────────────────

exports.cancelDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({
      _id: req.params.id,
      client: req.user._id,
    });
    if (!delivery) {
      return rv.send(res, deliveryView.notFound());
    }
    if (delivery.clientStatus === 'delivered') {
      return rv.send(res, deliveryView.badRequest('Cannot cancel a delivered order'));
    }
    if (delivery.clientStatus === 'cancelled') {
      return rv.send(res, deliveryView.badRequest('Order is already cancelled'));
    }
    if (delivery.clientStatus === 'picked_up' || delivery.clientStatus === 'in_transit') {
      return rv.send(res, deliveryView.badRequest('Cannot cancel an order that is in progress'));
    }

    delivery.clientStatus = 'cancelled';
    await delivery.save();

    return rv.send(res, deliveryView.saved(delivery));
  } catch (error) {
    next(error);
  }
};
