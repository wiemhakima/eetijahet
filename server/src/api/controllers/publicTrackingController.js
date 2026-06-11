/**
 * Public Tracking Controller
 * No authentication required. Token-based access only.
 */
const Delivery = require('../../models/Delivery');
const logger   = require('../../utils/logger');
const rv = require('../../views/responseView');
const trackingView = require('../../views/trackingView');

// Fields excluded from DB query — sensitive or irrelevant for public tracking
const PRIVATE_FIELDS = '-client -clientInfo -estimatedPrice -productPrice -deliveryPrice -merchantCommission -rejectedBy -armadaOrderId -armadaStatus -armadaTrackingUrl -tracking_token -tracking_email_sent_at -gps_trace -agency -merchant -notes -desiredDate -packageType -broadcastedAt -broadcastExpiresAt';

const TOKEN_EXPIRY_DAYS = 7;

exports.trackByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token || token.length < 10) {
      return rv.send(res, trackingView.badRequest('Invalid token'));
    }

    const delivery = await Delivery.findOne({ tracking_token: token })
      .populate('driver', 'firstName')
      .select(PRIVATE_FIELDS)
      .lean();

    if (!delivery) {
      return rv.send(res, trackingView.notFound('Tracking link not found'));
    }

    // Check token expiry: 7 days after delivery completion
    if (delivery.clientStatus === 'delivered' && delivery.completed_at) {
      const expiresAt = new Date(delivery.completed_at.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      if (new Date() > expiresAt) {
        return rv.send(res, rv.gone('Tracking link has expired', { expired: true }));
      }
    }

    // Build safe response — only what the client needs to render the map
    const data = {
      orderId:      delivery.orderId,
      clientStatus: delivery.clientStatus,
      dropoffLabel: delivery.dropoffLabel || null,
      dropoffLat:   delivery.dropoffLat   || null,
      dropoffLng:   delivery.dropoffLng   || null,
      pickupLabel:  delivery.pickupLabel  || null,
      pickupLat:    delivery.pickupLat    || null,
      pickupLng:    delivery.pickupLng    || null,
      lastLat:      delivery.lastLat      || null,
      lastLng:      delivery.lastLng      || null,
      eta_minutes:  delivery.eta_minutes  || null,
      completed_at: delivery.completed_at || null,
      driverName:   delivery.driver ? delivery.driver.firstName : null,
    };

    return rv.send(res, rv.success({ data }));
  } catch (error) {
    logger.error(`publicTrackByToken error: ${error.message}`);
    next(error);
  }
};
