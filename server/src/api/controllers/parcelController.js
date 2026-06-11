
/**
 * Parcel Controller — admin tooling for status updates.
 */
const Delivery = require('../../models/Delivery');
const { VALID_STATUSES, CLIENT_STATUSES } = require('../../models/Delivery');
const logger = require('../../utils/logger');
const rv = require('../../views/responseView');
const parcelView = require('../../views/parcelView');

// ── PATCH /api/v1/parcels/:id/status ─────────────────────────────────────────
exports.updateParcelStatus = async (req, res, next) => {
  try {
    const { status, lat, lng } = req.body;

    if (!status) {
      return rv.send(res, parcelView.badRequest('status is required'));
    }

    const isClientStatus = CLIENT_STATUSES.includes(status);
    const isDriverStatus = VALID_STATUSES.includes(status);

    if (!isClientStatus && !isDriverStatus) {
      return rv.send(res, parcelView.badRequest(
        `status must be one of: ${[...new Set([...CLIENT_STATUSES, ...VALID_STATUSES])].join(', ')}`
      ));
    }

    const setOp = {};
    if (isClientStatus) setOp.clientStatus = status;
    if (isDriverStatus) setOp.status       = status;
    if (typeof lat === 'number') setOp.lastLat = lat;
    if (typeof lng === 'number') setOp.lastLng = lng;
    if (status === 'delivered') setOp.completed_at = new Date();

    const pushOp = (typeof lat === 'number' && typeof lng === 'number')
      ? { $push: { gps_trace: { lat, lng, timestamp: new Date() } } }
      : {};

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { $set: setOp, ...pushOp },
      { new: true },
    ).populate('client', 'firstName lastName');

    if (!delivery) {
      return rv.send(res, parcelView.notFound('Parcel not found'));
    }

    return rv.send(res, parcelView.saved(delivery));
  } catch (err) {
    logger.error(`updateParcelStatus: ${err.message}`);
    next(err);
  }
};
