/**
 * Delivery Routes
 *
 * POST   /api/route                    — A* route from Core Flask engine
 * PATCH  /api/deliveries/:id/status    — Update delivery status + GPS position
 * POST   /api/deliveries/:id/complete  — Mark delivery done, save GPS trace
 */
const express = require('express');
const axios   = require('axios');
const Delivery = require('../../models/Delivery');
const { VALID_STATUSES } = require('../../models/Delivery');
const logger  = require('../../utils/logger');

const router = express.Router();

// Core Flask A* engine — same host/port used by the Sandbox
const CORE_URL = process.env.CORE_URL || 'http://127.0.0.1:3000';

// ── Haversine straight-line fallback ─────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R  = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function straightLineRoute(pickup, delivery) {
  const distKm = haversineKm(pickup.lat, pickup.lng, delivery.lat, delivery.lng);
  // Interpolate 5 points for a "line" polyline
  const polyline = [0, 0.25, 0.5, 0.75, 1].map((t) => [
    pickup.lat  + (delivery.lat  - pickup.lat)  * t,
    pickup.lng  + (delivery.lng  - pickup.lng)  * t,
  ]);
  return {
    polyline,
    distance_km:  Math.round(distKm * 10) / 10,
    eta_seconds:  Math.round((distKm / 40) * 3600), // assume 40 km/h average
    fallback:     true,
  };
}

// ── POST /api/route ───────────────────────────────────────────────────────────
router.post('/route', async (req, res) => {
  const { pickup, delivery } = req.body;

  if (
    !pickup  || typeof pickup.lat  !== 'number' || typeof pickup.lng  !== 'number' ||
    !delivery || typeof delivery.lat !== 'number' || typeof delivery.lng !== 'number'
  ) {
    return res.status(400).json({
      error: 'Body must contain pickup: {lat, lng} and delivery: {lat, lng}',
    });
  }

  try {
    // Core Flask expects: { start: [lat, lon], end: [lat, lon] }
    const coreRes = await axios.post(
      `${CORE_URL}/predict_route`,
      {
        start: [pickup.lat,   pickup.lng],
        end:   [delivery.lat, delivery.lng],
      },
      { timeout: 8000 }
    );

    const data = coreRes.data;
    // Core returns: { path: [[lat,lng],...], distance, eta, fallback }
    return res.json({
      polyline:    data.path     || [],
      eta_seconds: data.eta      || 0,
      distance_km: data.distance ? Math.round(data.distance / 100) / 10 : 0,
      fallback:    data.fallback || false,
    });
  } catch (err) {
    // Core engine is not running — return straight-line fallback
    logger.warn(`Core A* engine unreachable (${err.message}), using fallback route`);
    return res.json(straightLineRoute(pickup, delivery));
  }
});

// ── PATCH /api/deliveries/:id/status ─────────────────────────────────────────
router.patch('/deliveries/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, lat, lng } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const update = {
      status,
      updated_at: new Date(),
    };
    if (typeof lat === 'number') update.lastLat = lat;
    if (typeof lng === 'number') update.lastLng = lng;

    // Append GPS point to trace if coordinates provided
    const push = (typeof lat === 'number' && typeof lng === 'number')
      ? { $push: { gps_trace: { lat, lng, timestamp: new Date() } } }
      : {};

    const doc = await Delivery.findByIdAndUpdate(
      id,
      { $set: update, ...push },
      { new: true, upsert: true }
    );

    // Simple remaining ETA estimate based on status
    const ETA_BY_STATUS = {
      going_to_pickup: 15 * 60,
      picked_up:       10 * 60,
      on_the_way:       8 * 60,
      delivered:        0,
      failed:           0,
    };

    return res.json({
      status:        doc.status,
      eta_remaining: ETA_BY_STATUS[doc.status] ?? null,
      updated_at:    doc.updatedAt,
    });
  } catch (err) {
    logger.error(`PATCH /deliveries/${id}/status error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/deliveries/:id/complete ────────────────────────────────────────
router.post('/deliveries/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { status = 'delivered', lat, lng, actual_time_seconds } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const update = {
      status,
      completed_at: new Date(),
    };
    if (typeof actual_time_seconds === 'number') {
      update.actual_time_seconds = actual_time_seconds;
    }
    if (typeof lat === 'number') update.lastLat = lat;
    if (typeof lng === 'number') update.lastLng = lng;

    const push = (typeof lat === 'number' && typeof lng === 'number')
      ? { $push: { gps_trace: { lat, lng, timestamp: new Date() } } }
      : {};

    const doc = await Delivery.findByIdAndUpdate(
      id,
      { $set: update, ...push },
      { new: true, upsert: true }
    );

    const predicted = doc.eta_predicted_seconds ?? null;
    const actual    = typeof actual_time_seconds === 'number' ? actual_time_seconds : null;
    const diff      = predicted !== null && actual !== null ? actual - predicted : null;

    return res.json({
      summary: {
        eta_predicted: predicted,
        eta_actual:    actual,
        difference:    diff,
      },
    });
  } catch (err) {
    logger.error(`POST /deliveries/${id}/complete error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
