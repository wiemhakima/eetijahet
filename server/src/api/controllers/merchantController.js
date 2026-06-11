/**
 * Merchant Controller — Agency Admin
 * CRUD for merchants belonging to the authenticated agency.
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const Merchant = require('../../models/Merchant');
const Delivery = require('../../models/Delivery');
const User = require('../../models/User');
const UserApiSettings = require('../../models/UserApiSettings');
const emailService = require('../../services/emailService');
const logger = require('../../utils/logger');
const rv = require('../../views/responseView');
const agencyView = require('../../views/agencyView');

// ── GET /api/v1/agencies/me/merchants ─────────────────────────────────────────

exports.getMerchants = async (req, res, next) => {
  try {
    const merchants = await Merchant.find({ agency: req.user.agency })
      .select('storeName logo commission isActive address stats user')
      .populate('user', 'firstName lastName email phone createdAt')
      .sort({ createdAt: -1 });

    return rv.send(res, agencyView.merchantList(merchants, undefined));
  } catch (err) {
    logger.error(`getMerchants error: ${err.message}`);
    next(err);
  }
};

// ── GET /api/v1/agencies/me/merchants/stats ───────────────────────────────────

exports.getMerchantStats = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const [agg] = await Merchant.aggregate([
      { $match: { agency: new mongoose.Types.ObjectId(req.user.agency) } },
      {
        $group: {
          _id: null,
          totalMerchants:  { $sum: 1 },
          activeMerchants: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalCommissions:{ $sum: '$stats.totalCommission' },
          totalRevenue:    { $sum: '$stats.totalRevenue' },
          totalOrders:     { $sum: '$stats.totalOrders' },
        },
      },
    ]);

    return rv.send(res, agencyView.stats(agg || { totalMerchants: 0, activeMerchants: 0, totalCommissions: 0 }));
  } catch (err) {
    logger.error(`getMerchantStats error: ${err.message}`);
    next(err);
  }
};

// ── GET /api/v1/agencies/me/merchants/:id ─────────────────────────────────────

exports.getMerchant = async (req, res, next) => {
  try {
    const merchant = await Merchant.findOne({ _id: req.params.id, agency: req.user.agency })
      .populate('user', 'firstName lastName email phone createdAt');

    if (!merchant) {
      return rv.send(res, agencyView.notFound('Merchant not found'));
    }

    return rv.send(res, agencyView.merchant(merchant));
  } catch (err) {
    logger.error(`getMerchant error: ${err.message}`);
    next(err);
  }
};

// ── POST /api/v1/agencies/me/merchants ───────────────────────────────────────

exports.createMerchant = async (req, res, next) => {
  try {
    const { storeName, contactName, email, phone, address, city, lat, lng, commission, logo } = req.body;

    if (!storeName || !contactName || !email) {
      return rv.send(res, agencyView.badRequest('storeName, contactName and email are required'));
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return rv.send(res, agencyView.badRequest('An account with this email already exists'));
    }

    // Generate a random temporary password
    const generatedPassword = crypto.randomBytes(4).toString('hex') + 'A1!';

    const nameParts  = contactName.trim().split(' ');
    const firstName  = nameParts[0];
    const lastName   = nameParts.slice(1).join(' ') || '';

    // Every User needs an activeApiSettings record
    const apiSettings = await UserApiSettings.create({ totalCredits: 0, usedCredits: 0 });

    const user = await User.create({
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      phone: phone || '',
      password: generatedPassword,
      role: 'merchant',
      agency: req.user.agency,
      activeApiSettings: apiSettings._id,
    });

    const merchant = await Merchant.create({
      storeName,
      user: user._id,
      agency: req.user.agency,
      commission: commission ?? 10,
      logo: logo || '',
      address: {
        street: (address && isNaN(Number(address))) ? address : '',
        city:   (city    && isNaN(Number(city)))    ? city    : '',
        lat:    lat != null ? parseFloat(lat) : undefined,
        lng:    lng != null ? parseFloat(lng) : undefined,
      },
    });

    // Send credentials email (non-blocking — don't fail the request)
    emailService.sendMerchantCredentials(
      email.trim().toLowerCase(),
      storeName,
      contactName,
      generatedPassword,
      commission ?? 10,
    ).catch(e => logger.warn(`sendMerchantCredentials failed: ${e.message}`));

    logger.info(`Merchant created: ${storeName} (${email}) by agency ${req.user.agency}`);

    return rv.send(res, rv.created({
      data: merchant,
      // Expose in non-production so agency can copy credentials before email arrives
      ...(process.env.NODE_ENV !== 'production' && {
        credentials: { email: email.trim().toLowerCase(), password: generatedPassword },
      }),
    }));
  } catch (err) {
    logger.error(`createMerchant error: ${err.message}`);
    next(err);
  }
};

// ── PUT /api/v1/agencies/me/merchants/:id ────────────────────────────────────

exports.updateMerchant = async (req, res, next) => {
  try {
    const { storeName, commission, address, city, lat, lng, isActive, logo } = req.body;

    const $set = {};
    if (storeName  !== undefined) $set.storeName          = storeName;
    if (commission !== undefined) $set.commission         = commission;
    if (isActive   !== undefined) $set.isActive           = isActive;
    if (logo       !== undefined) $set.logo               = logo;
    if (address !== undefined && (address === '' || isNaN(Number(address)))) $set['address.street'] = address;
    if (city    !== undefined && (city    === '' || isNaN(Number(city))))    $set['address.city']   = city;
    if (lat     !== undefined) $set['address.lat'] = parseFloat(lat);
    if (lng     !== undefined) $set['address.lng'] = parseFloat(lng);

    const merchant = await Merchant.findOneAndUpdate(
      { _id: req.params.id, agency: req.user.agency },
      { $set },
      { new: true, runValidators: true },
    ).populate('user', 'firstName lastName email phone');

    if (!merchant) {
      return rv.send(res, agencyView.notFound('Merchant not found'));
    }

    return rv.send(res, agencyView.merchantSaved(merchant));
  } catch (err) {
    logger.error(`updateMerchant error: ${err.message}`);
    next(err);
  }
};

// ── DELETE /api/v1/agencies/me/merchants/:id ─────────────────────────────────

exports.deleteMerchant = async (req, res, next) => {
  try {
    const merchant = await Merchant.findOneAndDelete({ _id: req.params.id, agency: req.user.agency });

    if (!merchant) {
      return rv.send(res, agencyView.notFound('Merchant not found'));
    }

    // Deactivate the linked user account
    await User.findByIdAndUpdate(merchant.user, { role: 'user' });

    logger.info(`Merchant deleted: ${merchant.storeName} (${merchant._id})`);

    return rv.send(res, agencyView.merchantDeleted());
  } catch (err) {
    logger.error(`deleteMerchant error: ${err.message}`);
    next(err);
  }
};

// ── GET /api/v1/agencies/me/merchants/cleanup  (ONE-TIME — delete after use) ──

exports.cleanupAddresses = async (req, res, next) => {
  try {
    const result = await Merchant.updateMany(
      { 'address.street': { $regex: /^\d+\.\d+/ } },
      { $set: { 'address.street': '', 'address.city': '' } },
    );
    logger.info(`cleanupAddresses: ${result.modifiedCount} merchants cleaned`);
    return rv.send(res, rv.success({ modified: result.modifiedCount }));
  } catch (err) {
    logger.error(`cleanupAddresses error: ${err.message}`);
    next(err);
  }
};

// ── GET /api/v1/agencies/me/merchants/with-stats ──────────────────────────────
// Returns each merchant with live pending/completed counts and aggregated stats.

exports.getMerchantsWithStats = async (req, res, next) => {
  try {
    const ArmadaOrder = require('../../models/ArmadaOrder');

    console.log('[getMerchantsWithStats] User ID:', req.user._id);
    console.log('[getMerchantsWithStats] User role:', req.user.role);
    console.log('[getMerchantsWithStats] User agency:', req.user.agency);

    const merchants = await Merchant.find({ agency: req.user.agency })
      .populate('user', 'firstName lastName email phone')
      .lean();

    console.log('[getMerchantsWithStats] Merchants found:', merchants.length);

    const agencyOid = new mongoose.Types.ObjectId(req.user.agency);

    const statsAgg = await ArmadaOrder.aggregate([
      { $match: { agency: agencyOid } },
      {
        $group: {
          _id:             '$merchant',
          totalOrders:     { $sum: 1 },
          delivered:       { $sum: { $cond: [{ $in: ['$status', ['delivered', 'completed']] }, 1, 0] } },
          pendingOrders:   { $sum: { $cond: [{ $in: ['$status', ['pending', 'dispatched', 'en_route']] }, 1, 0] } },
          totalRevenue:    { $sum: '$productAmount' },
          totalCommission: { $sum: '$commissionAmount' },
        },
      },
    ]);

    const statsMap = Object.fromEntries(statsAgg.map(r => [String(r._id), r]));

    const result = merchants.map(m => {
      const s = statsMap[String(m._id)] || {};
      return {
        ...m,
        pendingOrders:   s.pendingOrders   || 0,
        completedOrders: s.delivered       || 0,
        stats: {
          totalOrders:     s.totalOrders     || 0,
          delivered:       s.delivered       || 0,
          totalRevenue:    s.totalRevenue    || 0,
          totalCommission: s.totalCommission || 0,
        },
      };
    });

    return rv.send(res, rv.success({ data: result }));
  } catch (err) {
    logger.error(`getMerchantsWithStats error: ${err.message}`);
    next(err);
  }
};

// ── GET /api/v1/agencies/me/merchants/:merchantId/orders ──────────────────────
// Returns orders for a specific merchant, filtered by status group.

exports.getMerchantOrders = async (req, res, next) => {
  try {
    const ArmadaOrder = require('../../models/ArmadaOrder');
    const { merchantId } = req.params;
    const { status } = req.query; // 'pending' | 'completed' | undefined (all)

    const merchant = await Merchant.findOne({ _id: merchantId, agency: req.user.agency });
    if (!merchant) {
      return rv.send(res, agencyView.notFound('Merchant not found'));
    }

    const ACTIVE_STATUSES   = ['pending', 'dispatched', 'en_route'];
    const COMPLETE_STATUSES = ['delivered', 'completed'];

    let statusFilter;
    if (status === 'pending')   statusFilter = { $in: ACTIVE_STATUSES };
    if (status === 'completed') statusFilter = { $in: COMPLETE_STATUSES };

    const filter = {
      merchant: new mongoose.Types.ObjectId(merchantId),
      agency:   req.user.agency,
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    const orders = await ArmadaOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    return rv.send(res, rv.success({ data: orders }));
  } catch (err) {
    logger.error(`getMerchantOrders error: ${err.message}`);
    next(err);
  }
};
