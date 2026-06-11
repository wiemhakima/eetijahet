/**
 * Merchant Order Controller
 * Routes for authenticated merchant users to manage their own orders.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Delivery = require('../../models/Delivery');
const Merchant = require('../../models/Merchant');
const User = require('../../models/User');
const armadaService = require('../../services/armadaService');
const socket = require('../../socket');
const logger = require('../../utils/logger');
const rv = require('../../views/responseView');
const merchantView = require('../../views/merchantView');

const ARMADA_STATUS_MAP = {
  pending:     'Pending',
  dispatched:  'Dispatched',
  en_route:    'En Route',
  delivered:   'Delivered',
  cancelled:   'Cancelled',
};

// Helper: find merchant profile for current user
const findMerchant = async (userId) => {
  const merchant = await Merchant.findOne({ user: userId });
  if (!merchant) throw Object.assign(new Error('Merchant profile not found'), { status: 404 });
  return merchant;
};

// ── GET /api/v1/merchant/profile ─────────────────────────────────────────────

exports.getMyProfile = async (req, res, next) => {
  try {
    const merchant = await Merchant.findOne({ user: req.user._id })
      .populate('agency', 'name logo phone address')
      .populate('user', 'firstName lastName email phone');

    if (!merchant) {
      return rv.send(res, merchantView.notFound('Merchant profile not found'));
    }

    return rv.send(res, merchantView.merchant(merchant));
  } catch (err) {
    logger.error(`getMyProfile error: ${err.message}`);
    next(err);
  }
};

// ── GET /api/v1/merchant/stats ────────────────────────────────────────────────

exports.getMyStats = async (req, res, next) => {
  try {
    const merchant = await findMerchant(req.user._id);

    const [agg] = await Delivery.aggregate([
      { $match: { merchant: new mongoose.Types.ObjectId(merchant._id) } },
      {
        $group: {
          _id: null,
          totalOrders:     { $sum: 1 },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$clientStatus', 'delivered'] }, 1, 0] } },
          pendingOrders:   {
            $sum: {
              $cond: [
                { $in: ['$clientStatus', ['pending', 'broadcasting', 'accepted', 'picked_up', 'in_transit']] },
                1, 0,
              ],
            },
          },
          totalRevenue:    { $sum: '$productPrice' },
          totalCommission: { $sum: '$merchantCommission' },
        },
      },
    ]);

    return rv.send(res, merchantView.stats({
      ...(agg || { totalOrders: 0, deliveredOrders: 0, pendingOrders: 0, totalRevenue: 0, totalCommission: 0 }),
      commission: merchant.commission,
    }));
  } catch (err) {
    logger.error(`getMyStats error: ${err.message}`);
    next(err);
  }
};

// ── GET /api/v1/merchant/orders ───────────────────────────────────────────────

exports.getMyOrders = async (req, res, next) => {
  try {
    const merchant = await findMerchant(req.user._id);
    const { status, page = 1, limit = 30 } = req.query;

    const filter = { merchant: merchant._id };
    if (status) filter.clientStatus = status;

    const total = await Delivery.countDocuments(filter);
    const deliveries = await Delivery.find(filter)
      .populate('driver', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return rv.send(res, merchantView.orderList(deliveries, { total, page: parseInt(page), limit: parseInt(limit) }));
  } catch (err) {
    logger.error(`getMyOrders error: ${err.message}`);
    next(err);
  }
};

// ── POST /api/v1/merchant/orders ──────────────────────────────────────────────

exports.createOrder = async (req, res, next) => {
  try {
    const {
      clientName, clientPhone, clientEmail,
      pickupAddress, deliveryAddress,
      productPrice = 0, deliveryPrice = 0,
      packageType = 'medium', notes,
      deliveryCity, paymentType = 'paid',
      dropoffLat, dropoffLon,
    } = req.body;

    if (!clientName || !deliveryAddress) {
      return rv.send(res, merchantView.badRequest('clientName and deliveryAddress are required'));
    }

    const merchant = await findMerchant(req.user._id);

    // ── 1. Call Armada first — get the order ID before saving locally ──────────
    const armadaRes = await armadaService.createArmadaOrder(
      {
        customerName:    clientName,
        phone:           clientPhone || '',
        productPrice:    parseFloat(productPrice),
        notes:           notes || '',
        city:            deliveryCity || '',
        deliveryAddress: deliveryAddress,
        paymentType,
        dropoffLat:      dropoffLat != null ? parseFloat(dropoffLat) : null,
        dropoffLon:      dropoffLon != null ? parseFloat(dropoffLon) : null,
      },
      req.user._id
    );

    const armadaOrderId    = armadaRes.id || armadaRes.order_id || null;
    const armadaStatus     = armadaRes.status || 'pending';
    const armadaTrackingUrl = armadaRes.tracking_url || null;

    // ── 2. Save locally with Armada ID included from the start ─────────────────
    const commissionAmount = Math.round((parseFloat(productPrice) * merchant.commission) / 100 * 100) / 100;
    const trackingCode     = crypto.randomBytes(3).toString('hex').toUpperCase();

    const delivery = await Delivery.create({
      orderId: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      agency:       merchant.agency,
      merchant:     merchant._id,
      clientInfo:   { name: clientName, phone: clientPhone || '', email: clientEmail ? clientEmail.toLowerCase() : '' },
      trackingCode,
      pickupLabel:  pickupAddress || merchant.address?.street || merchant.storeName,
      dropoffLabel: deliveryAddress,
      productPrice:       parseFloat(productPrice),
      deliveryPrice:      parseFloat(deliveryPrice),
      merchantCommission: commissionAmount,
      estimatedPrice:     parseFloat(deliveryPrice),
      packageType,
      notes: notes || '',
      clientStatus:       'broadcasting',
      status:             'going_to_pickup',
      broadcastedAt:      new Date(),
      broadcastExpiresAt: new Date(Date.now() + 60_000),
      // Armada fields set at creation — no second update needed
      armadaOrderId,
      armadaStatus,
      armadaTrackingUrl,
    });

    logger.info(`Order created: ${trackingCode} → Armada ${armadaOrderId} (merchant: ${merchant.storeName})`);

    // ── 3. Side-effects (non-blocking) ─────────────────────────────────────────
    Merchant.findByIdAndUpdate(merchant._id, {
      $inc: {
        'stats.totalOrders':     1,
        'stats.totalRevenue':    parseFloat(productPrice),
        'stats.totalCommission': commissionAmount,
      },
    }).catch(e => logger.warn(`merchant stats update failed: ${e.message}`));

    socket.emitToAgency(String(merchant.agency), 'new_order', {
      deliveryId: delivery._id, trackingCode,
      merchantId: merchant._id, merchantName: merchant.storeName,
      clientName, deliveryAddress, productPrice, status: 'pending',
    });

    return rv.send(res, merchantView.orderCreated({
      _id:              delivery._id,
      trackingCode,
      commission:      commissionAmount,
      status:          'broadcasting',
      armadaOrderId,
      armadaStatus,
      armadaTrackingUrl,
    }));
  } catch (err) {
    if (err.status === 404) return rv.send(res, merchantView.notFound(err.message));
    logger.error(`createOrder error: ${err.response?.data || err.message}`);
    return rv.send(res, rv.serverError(err.response?.data || err.message));
  }
};

// ── PATCH /api/v1/merchant/profile ───────────────────────────────────────────

exports.updateProfile = async (req, res, next) => {
  try {
    const { storeName, logo, firstName, lastName, phone, lat, lng, city } = req.body;

    const merchantSet = {};
    if (storeName !== undefined) merchantSet.storeName       = storeName;
    if (logo      !== undefined) merchantSet.logo            = logo;
    if (city      !== undefined) merchantSet['address.city'] = city;
    if (lat  != null)            merchantSet['address.lat']  = parseFloat(lat);
    if (lng  != null)            merchantSet['address.lng']  = parseFloat(lng);

    if (Object.keys(merchantSet).length) {
      await Merchant.findOneAndUpdate({ user: req.user._id }, { $set: merchantSet });
    }

    const userSet = {};
    if (firstName !== undefined) userSet.firstName = firstName;
    if (lastName  !== undefined) userSet.lastName  = lastName;
    if (phone     !== undefined) userSet.phone     = phone;

    if (Object.keys(userSet).length) {
      await User.findByIdAndUpdate(req.user._id, { $set: userSet });
    }

    const merchant = await Merchant.findOne({ user: req.user._id })
      .populate('agency', 'name logo phone address')
      .populate('user', 'firstName lastName email phone');

    return rv.send(res, merchantView.merchantSaved(merchant));
  } catch (err) {
    logger.error(`updateProfile error: ${err.message}`);
    next(err);
  }
};

// ── PATCH /api/v1/merchant/change-password ────────────────────────────────────

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return rv.send(res, merchantView.badRequest('Les deux mots de passe sont requis.'));
    }
    if (newPassword.length < 8) {
      return rv.send(res, merchantView.badRequest('Le nouveau mot de passe doit contenir au moins 8 caractères.'));
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user?.password) {
      return rv.send(res, merchantView.badRequest('Aucun mot de passe configuré pour ce compte.'));
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return rv.send(res, rv.badRequest('Mot de passe actuel incorrect.'));
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user._id, { $set: { password: hashed } });

    return rv.send(res, rv.success({ message: 'Mot de passe changé avec succès.' }));
  } catch (err) {
    logger.error(`changePassword error: ${err.message}`);
    next(err);
  }
};

// ── GET /api/v1/merchant/orders/:armadaOrderId/track ──────────────────────────

exports.trackOrder = async (req, res, next) => {
  try {
    const { armadaOrderId } = req.params;

    const data = await armadaService.getOrder(armadaOrderId, process.env.ARMADA_TOKEN);

    return rv.send(res, rv.success({
      data: {
        armadaOrderId,
        status:       data.status || null,
        statusLabel:  ARMADA_STATUS_MAP[data.status] || data.status || 'Unknown',
        trackingLink: data.trackingLink || data.tracking_url || null,
        driver:       data.driver || null,
        rawArmada:    data,
      },
    }));
  } catch (err) {
    logger.error(`trackOrder error: ${err.response?.data || err.message}`);
    return rv.send(res, rv.serverError(err.response?.data || err.message));
  }
};
