/**
 * Agency controller — onboarding, profile management, and driver management.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Agency = require('../../models/Agency');
const User = require('../../models/User');
const Delivery = require('../../models/Delivery');
const Subscription = require('../../models/Subscription');
const Notification = require('../../models/Notification');
const UserApiSettings = require('../../models/UserApiSettings');
const config = require('../../config');
const { getPlan, planToAgencySettings } = require('../../config/plans');
const logger = require('../../utils/logger');
const socket = require('../../socket');
const rv = require('../../views/responseView');
const agencyView = require('../../views/agencyView');

/**
 * @desc  List all publicly visible active agencies (Kuwait marketplace)
 * @route GET /api/v1/agencies/public
 * @access Public
 */
exports.getPublicAgencies = async (req, res, next) => {
  try {
    const { zone } = req.query;
    const filter = { status: 'active' };
    if (zone) filter.coverageZones = zone;

    const agencies = await Agency.find(filter)
      .select('name nameAr logo priceBase coverageZones rating ratingCount currency slug')
      .sort({ rating: -1, createdAt: -1 })
      .limit(50);

    return rv.send(res, rv.success({ count: agencies.length, data: agencies }));
  } catch (error) {
    next(error);
  }
};
const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, agencyId: user.agency },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

// ── Onboarding ───────────────────────────────────────────────────────────────

/**
 * @desc  Register a new agency + owner account (starts a 14-day trial)
 * @route POST /api/v1/agencies/register
 * @access Public
 */
exports.register = async (req, res, next) => {
  try {
    const { agencyName, email, password, firstName, lastName, phone, plan = 'basic' } = req.body;

    if (!agencyName || !email || !password || !firstName) {
      return rv.send(res, rv.badRequest('agencyName, email, password and firstName are required.'));
    }

    // Validate plan
    try { getPlan(plan); } catch {
      return rv.send(res, rv.badRequest(`Invalid plan: ${plan}. Choose basic, pro or enterprise.`));
    }

    // Prevent duplicate owner email
    if (await User.findOne({ email })) {
      return rv.send(res, rv.badRequest('An account with this email already exists.'));
    }

    // Pre-generate the owner's ObjectId so agency and user can reference each other
    // without a circular create dependency.
    const ownerId = new mongoose.Types.ObjectId();

    // 1. Create API settings for the owner account
    const apiSettings = await UserApiSettings.create({
      totalCredits: 0,
      usedCredits: 0,
    });

    // 2. Create agency FIRST (using the pre-generated owner ID)
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const agency = await Agency.create({
      name: agencyName,
      email,
      phone,
      owner: ownerId,
      status: 'trial',
      trialEndsAt,
      settings: planToAgencySettings(plan),
    });

    // 3. Create owner with pre-set _id and agency — validation passes immediately
    const owner = await User.create({
      _id: ownerId,
      firstName,
      lastName: lastName || '',
      email,
      password,
      role: 'agency_admin',
      agency: agency._id,
      activeApiSettings: apiSettings._id,
    });

    // 4. Create trial subscription
    const subscription = await Subscription.create({
      agency: agency._id,
      plan,
      billing: 'monthly',
      status: 'trialing',
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEndsAt,
    });

    // 5. Attach subscription reference to agency
    agency.subscription = subscription._id;
    await agency.save();

    // 6. Welcome notification
    await Notification.create({
      title: `Welcome to Etijahat, ${agencyName}!`,
      message: `Your 14-day free trial has started. Explore all ${plan.charAt(0).toUpperCase() + plan.slice(1)} features and upgrade anytime.`,
      type: 'success',
      user: owner._id,
      global: false,
    });

    const token = generateToken(owner);
    owner.password = undefined;

    logger.info(`New agency registered: ${agencyName} (${email}), plan: ${plan}`);

    return rv.send(res, rv.created({ token, data: { agency, owner, subscription } }));
  } catch (error) {
    logger.error(`Agency register error: ${error.message}`);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      return rv.send(res, rv.badRequest(messages.join(', ')));
    }
    next(error);
  }
};

// ── Agency profile ────────────────────────────────────────────────────────────

/**
 * @desc  Get the current agency profile
 * @route GET /api/v1/agencies/me
 * @access Private (agency_admin)
 */
exports.getMyAgency = async (req, res, next) => {
  try {
    const agency = await Agency.findById(req.agency._id)
      .populate('owner', 'firstName lastName email')
      .populate('subscription');

    return rv.send(res, agencyView.agency(agency));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Update agency profile (name, phone, address, logo)
 * @route PUT /api/v1/agencies/me
 * @access Private (agency_admin)
 */
exports.updateMyAgency = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'address', 'logo'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return rv.send(res, agencyView.badRequest('No valid fields to update.'));
    }

    const agency = await Agency.findByIdAndUpdate(req.agency._id, updates, {
      new: true,
      runValidators: true,
    });

    return rv.send(res, agencyView.agencySaved(agency));
  } catch (error) {
    next(error);
  }
};

// ── Client management ─────────────────────────────────────────────────────────

/**
 * @desc  List all clients belonging to the agency
 * @route GET /api/v1/agencies/me/clients
 * @access Private (agency_admin)
 */
exports.listClients = async (req, res, next) => {
  try {
    const clients = await User.find({ agency: req.agency._id, role: 'user' })
      .select('-password -activeApiSettings')
      .sort({ createdAt: -1 });

    return rv.send(res, rv.success({ count: clients.length, data: clients }));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Invite (create) a client account under the agency
 * @route POST /api/v1/agencies/me/clients/invite
 * @access Private (agency_admin)
 */
exports.inviteClient = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, sendWhatsapp = true } = req.body;

    if (!firstName || !email) {
      return rv.send(res, agencyView.badRequest('firstName and email are required.'));
    }

    if (await User.findOne({ email: email.toLowerCase() })) {
      return rv.send(res, agencyView.badRequest('An account with this email already exists.'));
    }

    // Auto-generate a secure password
    const generatedPassword = crypto.randomBytes(4).toString('hex') + '!@Tn';

    const apiSettings = await UserApiSettings.create({ totalCredits: 0, usedCredits: 0 });

    const client = await User.create({
      firstName,
      lastName: lastName || '',
      email: email.toLowerCase(),
      phone: phone || '',
      password: generatedPassword,        // model pre-save hook bcrypts this
      role: 'user',
      agency: req.agency._id,
      activeApiSettings: apiSettings._id,
    });

    await Notification.create({
      title: 'Welcome!',
      message: `You have been added as a client of ${req.agency.name}.`,
      type: 'info',
      user: client._id,
    });

    client.password = undefined;

    logger.info(`Client invited: ${email} → agency ${req.agency.name}`);
    return rv.send(res, rv.created({ data: client, message: 'Client created.' }));
  } catch (error) {
    logger.error(`Invite client error: ${error.message}`);
    next(error);
  }
};

// ── Delivery management ───────────────────────────────────────────────────────

/**
 * @desc  List deliveries belonging to the agency (paginated, filterable by status)
 * @route GET /api/v1/agencies/me/deliveries
 * @access Private (agency_admin)
 */
exports.listDeliveries = async (req, res, next) => {
  try {
    const ArmadaOrder = require('../../models/ArmadaOrder');
    const Merchant    = require('../../models/Merchant');

    console.log('[DEBUG] listDeliveries - user:', {
      id:     req.user._id,
      role:   req.user.role,
      agency: req.user.agency,
    });

    const page  = parseInt(req.query.page   || '1',  10);
    const limit = parseInt(req.query.limit  || '20', 10);
    const skip  = (page - 1) * limit;

    // Use req.user.agency (raw ObjectId from JWT) consistently to avoid any
    // type mismatch between req.agency._id (Mongoose doc) and stored ObjectId.
    const agencyId    = req.user.agency;
    const merchants   = await Merchant.find({ agency: agencyId }).select('_id');
    const merchantIds = merchants.map(m => m._id);
    console.log('[DEBUG] listDeliveries - merchantIds count:', merchantIds.length);

    const filter = {
      $or: [
        { agency:   agencyId },
        { merchant: { $in: merchantIds } },
      ],
    };

    if (req.query.status) {
      // Armada uses 'completed' and 'delivered' interchangeably for finished orders.
      // 'cancelled'/'canceled' spelling varies by integration (British vs American).
      if (req.query.status === 'delivered') {
        filter.status = { $in: ['delivered', 'completed'] };
      } else if (req.query.status === 'cancelled') {
        filter.status = { $in: ['cancelled', 'canceled'] };
      } else {
        filter.status = req.query.status;
      }
    }

    if (req.query.merchantId) filter.merchant = req.query.merchantId;

    const [orders, total] = await Promise.all([
      ArmadaOrder.find(filter)
        .populate('merchant', 'storeName logo commission')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ArmadaOrder.countDocuments(filter),
    ]);

    console.log('[DEBUG] listDeliveries - orders found:', orders.length, 'total:', total);
    return rv.send(res, rv.success({ total, page, limit, data: orders }));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Assign a driver to a delivery
 * @route PUT /api/v1/agencies/me/deliveries/:deliveryId/assign
 * @access Private (agency_admin)
 */
exports.assignDelivery = async (req, res, next) => {
  try {
    const Delivery = require('../../models/Delivery');
    const { driverId } = req.body;

    if (!driverId) {
      return rv.send(res, agencyView.badRequest('driverId is required.'));
    }

    // Verify the assigned user belongs to this agency
    const driver = await User.findOne({ _id: driverId, agency: req.agency._id });
    if (!driver) {
      return rv.send(res, agencyView.notFound('User not found in your agency.'));
    }

    const delivery = await Delivery.findOne({ _id: req.params.deliveryId, agency: req.agency._id });
    if (!delivery) {
      return rv.send(res, agencyView.notFound('Delivery not found.'));
    }

    delivery.driver = driverId;
    if (delivery.clientStatus === 'pending') delivery.clientStatus = 'accepted';
    await delivery.save();

    await delivery.populate('driver', 'firstName lastName email');
    await delivery.populate('client', 'firstName lastName email');

    return rv.send(res, agencyView.deliverySaved(delivery));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  List merchants belonging to the agency
 * @route GET /api/v1/agencies/me/merchants
 * @access Private (agency_admin)
 */
exports.listMerchants = async (req, res, next) => {
  try {
    const Merchant    = require('../../models/Merchant');
    const ArmadaOrder = require('../../models/ArmadaOrder');

    console.log('[DEBUG] listMerchants - user:', {
      id:     req.user._id,
      role:   req.user.role,
      agency: req.user.agency,
    });

    // Use req.user.agency (raw ObjectId) — req.agency._id is equivalent but this avoids
    // any edge case where resolveTenant fails silently for non-admin roles.
    const merchants = await Merchant.find({ agency: req.user.agency })
      .select('storeName logo commission isActive isOnline lastSeen address stats user')
      .populate('user', 'firstName lastName email phone')
      .sort({ storeName: 1 });

    console.log('[DEBUG] listMerchants - merchants found:', merchants.length);

    const merchantIds = merchants.map(m => m._id);

    const statsPerMerchant = await ArmadaOrder.aggregate([
      { $match: { merchant: { $in: merchantIds } } },
      { $group: {
        _id:             '$merchant',
        totalOrders:     { $sum: 1 },
        totalRevenue:    { $sum: '$productAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        delivered:       { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        pending:         { $sum: { $cond: [{ $eq: ['$status', 'pending']   }, 1, 0] } },
      }},
    ]);

    const statsMap = {};
    statsPerMerchant.forEach(s => { statsMap[String(s._id)] = s; });

    const enriched = merchants.map(m => {
      const s = statsMap[String(m._id)] || {
        totalOrders: 0, totalRevenue: 0, totalCommission: 0,
        delivered: 0, pending: 0,
      };
      return {
        ...m.toObject(),
        stats:          s,
        pendingOrders:  s.pending   || 0,
        completedOrders: s.delivered || 0,
      };
    });

    console.log('[listMerchants] Enriched sample:', enriched[0] ? { id: enriched[0]._id, pendingOrders: enriched[0].pendingOrders, stats: enriched[0].stats } : 'empty');
    return rv.send(res, rv.success({ count: enriched.length, data: enriched }));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get aggregated stats for the agency
 * @route GET /api/v1/agencies/me/stats
 * @access Private (agency_admin)
 */
exports.getStats = async (req, res, next) => {
  try {
    const ArmadaOrder = require('../../models/ArmadaOrder');
    const Merchant    = require('../../models/Merchant');

    console.log('[DEBUG] getStats - user:', {
      id:     req.user._id,
      role:   req.user.role,
      agency: req.user.agency,
    });

    const agencyId  = req.user.agency;
    const agencyOid = new mongoose.Types.ObjectId(agencyId);

    // Resolve merchants for indirect order link
    const merchants   = await Merchant.find({ agency: agencyId }).select('_id');
    const merchantIds = merchants.map(m => m._id);
    const orderFilter = {
      $or: [
        { agency: agencyOid },
        { merchant: { $in: merchantIds } },
      ],
    };

    console.log('[DEBUG] getStats - merchantIds count:', merchantIds.length);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      driversCount,
      clientsCount,
      deliveriesTotal,
      deliveriesToday,
      deliveriesInProgress,
      pendingCount,
      deliveredCount,
      commissionAgg,
    ] = await Promise.all([
      Promise.resolve(0),
      User.countDocuments({ agency: agencyId, role: 'user' }),
      ArmadaOrder.countDocuments(orderFilter),
      ArmadaOrder.countDocuments({ ...orderFilter, createdAt: { $gte: today } }),
      ArmadaOrder.countDocuments({ ...orderFilter, status: { $in: ['pending', 'going_to_pickup', 'picked_up', 'on_the_way'] } }),
      ArmadaOrder.countDocuments({ ...orderFilter, status: 'pending' }),
      ArmadaOrder.countDocuments({ ...orderFilter, status: { $in: ['delivered', 'completed'] } }),
      ArmadaOrder.aggregate([
        { $match: orderFilter },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
    ]);

    const totalCommission = commissionAgg[0]?.total ?? 0;

    return rv.send(res, agencyView.stats({
      driversCount, clientsCount,
      deliveriesTotal, deliveriesToday, deliveriesInProgress,
      pendingCount, deliveredCount, totalCommission,
    }));
  } catch (error) {
    next(error);
  }
};

// ── Super-admin ───────────────────────────────────────────────────────────────

/**
 * @desc  List all agencies (admin only)
 * @route GET /api/v1/super-admin/agencies
 * @access Private (admin)
 */
exports.listAllAgencies = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page  || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip  = (page - 1) * limit;

    const [agencies, total] = await Promise.all([
      Agency.find()
        .populate('owner', 'firstName lastName email')
        .populate('subscription', 'plan status currentPeriodEnd')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Agency.countDocuments(),
    ]);

    return rv.send(res, agencyView.agencyList(agencies, { total, page, limit }));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Suspend or activate an agency (admin only)
 * @route PUT /api/v1/super-admin/agencies/:agencyId
 * @access Private (admin)
 */
exports.updateAgencyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'trial'].includes(status)) {
      return rv.send(res, agencyView.badRequest('Invalid status value.'));
    }

    const agency = await Agency.findByIdAndUpdate(
      req.params.agencyId,
      { status },
      { new: true }
    );

    if (!agency) {
      return rv.send(res, agencyView.notFound('Agency not found.'));
    }

    logger.info(`Agency ${agency.name} status updated to ${status} by admin ${req.user.email}`);
    return rv.send(res, agencyView.agencySaved(agency));
  } catch (error) {
    next(error);
  }
};

// ── Agency: create delivery + auto-provision client account ──────────────────

/**
 * @desc  Agency admin creates a delivery and auto-creates a client account.
 *        Client receives an SMS with a 6-char code to track and log in.
 * @route POST /api/v1/agencies/me/deliveries
 * @access Private (agency_admin)
 */
exports.createClientDelivery = async (req, res, next) => {
  try {
    const {
      // Client info
      clientName, clientPhone, clientEmail,
      // Coordinates (preferred)
      pickupLat, pickupLng, pickupLabel,
      dropoffLat, dropoffLng, dropoffLabel,
      // Fallback text addresses
      pickupAddress, dropoffAddress,
      // Delivery details
      packageType, notes, desiredDate,
      estimatedPrice, distance_km, eta_minutes,
      // Optional immediate assignment
      driverId,
    } = req.body;

    if (!clientName || !clientPhone) {
      return rv.send(res, agencyView.badRequest('clientName and clientPhone are required'));
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const nameParts   = clientName.trim().split(/\s+/);

    // ── 1. Generate tracking code ────────────────────────────────────────────
    const trackingCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const codeExpires  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // ── 2. Determine auth flow and find/create client ────────────────────────
    const useEmailPassword = Boolean(clientEmail && clientEmail.trim());
    let client = null;
    let isNewClient = false;
    let generatedPassword = null;

    if (useEmailPassword) {
      // ── Email + password flow ──────────────────────────────────────────────
      client = await User.findOne({ email: clientEmail.trim().toLowerCase(), role: 'user' });

      if (!client) {
        // Generate a readable 12-char password: hex + suffix
        generatedPassword = crypto.randomBytes(5).toString('hex') + '!@';

        const apiSettings = await UserApiSettings.create({ totalCredits: 0 });
        client = await User.create({
          firstName:         nameParts[0],
          lastName:          nameParts.slice(1).join(' ') || '',
          email:             clientEmail.trim().toLowerCase(),
          phone:             clientPhone.trim(),
          password:          generatedPassword, // pre-save hook will bcrypt this
          role:              'user',
          agency:            null,
          activeApiSettings: apiSettings._id,
          loginCode:         trackingCode,
          loginCodeExpires:  codeExpires,
        });
        isNewClient = true;
        logger.info(`[AutoClient-Email] Created ${client._id} for ${clientEmail}`);
      } else {
        // Existing client — refresh code only (don't change password)
        client.loginCode        = trackingCode;
        client.loginCodeExpires = codeExpires;
        await client.save();
      }
    } else {
      // ── Code-only flow (phone only) ────────────────────────────────────────
      client = await User.findOne({ phone: clientPhone.trim(), role: 'user' });

      if (!client) {
        const apiSettings = await UserApiSettings.create({ totalCredits: 0 });
        client = await User.create({
          firstName:         nameParts[0],
          lastName:          nameParts.slice(1).join(' ') || '',
          phone:             clientPhone.trim(),
          role:              'user',
          agency:            null,
          activeApiSettings: apiSettings._id,
          loginCode:         trackingCode,
          loginCodeExpires:  codeExpires,
        });
        isNewClient = true;
        logger.info(`[AutoClient-Phone] Created ${client._id} for phone ${clientPhone}`);
      } else {
        client.loginCode        = trackingCode;
        client.loginCodeExpires = codeExpires;
        await client.save();
      }
    }

    // ── 3. Generate orderId ──────────────────────────────────────────────────
    const ts      = Date.now().toString(36).toUpperCase();
    const rnd     = Math.random().toString(36).substr(2, 4).toUpperCase();
    const orderId = `ORD-${ts}-${rnd}`;

    // ── 4. Create delivery ───────────────────────────────────────────────────
    const broadcastExpiry = new Date(Date.now() + 60_000); // 60s broadcast window
    const deliveryData = {
      orderId,
      trackingCode,
      agency:        req.agency._id,
      client:        client._id,
      pickupAddress: pickupAddress  || pickupLabel  || '',
      dropoffAddress: dropoffAddress || dropoffLabel || '',
      packageType:   packageType || 'small',
      notes:         notes       || '',
      clientStatus:  driverId ? 'accepted' : 'broadcasting',
      status:        'going_to_pickup',
      ...(driverId ? {} : {
        broadcastedAt:    new Date(),
        broadcastExpiresAt: broadcastExpiry,
      }),
    };

    if (pickupLat  !== undefined) deliveryData.pickupLat   = parseFloat(pickupLat);
    if (pickupLng  !== undefined) deliveryData.pickupLng   = parseFloat(pickupLng);
    if (pickupLabel)              deliveryData.pickupLabel  = pickupLabel;
    if (dropoffLat !== undefined) deliveryData.dropoffLat  = parseFloat(dropoffLat);
    if (dropoffLng !== undefined) deliveryData.dropoffLng  = parseFloat(dropoffLng);
    if (dropoffLabel)             deliveryData.dropoffLabel = dropoffLabel;
    if (desiredDate)              deliveryData.desiredDate  = new Date(desiredDate);
    if (estimatedPrice !== undefined) deliveryData.estimatedPrice = estimatedPrice;
    if (distance_km    !== undefined) deliveryData.distance_km    = distance_km;
    if (eta_minutes    !== undefined) deliveryData.eta_minutes    = eta_minutes;
    if (driverId)                     deliveryData.driver = driverId;

    const delivery = await Delivery.create(deliveryData);

    // ── 4b. Increment monthly delivery counter ───────────────────────────────
    await Agency.findByIdAndUpdate(req.agency._id, {
      $inc: { 'usage.deliveriesThisMonth': 1 },
    });

    logger.info(`[Delivery] ${delivery.orderId} | code: ${trackingCode} | client: ${client._id} | flow: ${useEmailPassword ? 'email+pwd' : 'code'}`);

    const trackingUrl = `${frontendUrl}/track?code=${trackingCode}`;
    const loginUrl    = `${frontendUrl}/login`;

    return rv.send(res, rv.created({
      delivery,
      trackingCode,
      trackingUrl,
      loginUrl,
      isNewClient,
      authFlow: useEmailPassword ? 'email_password' : 'magic_code',
      client: {
        id:    client._id,
        name:  `${client.firstName} ${client.lastName}`.trim(),
        phone: client.phone,
        email: client.email,
      },
      // Development only — never expose plaintext password in production
      ...(process.env.NODE_ENV !== 'production' && generatedPassword && { generatedPassword }),
      ...(process.env.NODE_ENV !== 'production' && { loginCode: trackingCode }),
    }));
  } catch (err) {
    logger.error(`createClientDelivery error: ${err.message}`);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(v => v.message);
      return rv.send(res, rv.badRequest(messages.join(', ')));
    }
    next(err);
  }
};

// ── Combined client + delivery creation ──────────────────────────────────────

/**
 * @desc  Create a client account + delivery in one request.
 *        If the client email already exists, reuse the account.
 *        Sends WhatsApp: new clients receive credentials + tracking link;
 *        existing clients receive the tracking link only.
 * @route POST /api/v1/agencies/me/clients-with-delivery
 * @access Private (agency_admin)
 */
exports.createClientWithDelivery = async (req, res, next) => {
  try {
    const {
      // Client
      firstName, lastName, email, phone,
      // Delivery
      pickupAddress,  pickupLat,  pickupLng,
      dropoffAddress, dropoffLat, dropoffLng,
      packageType, estimatedPrice, notes,
      // Driver
      driverId,
      // Options
      sendWhatsapp = true,
    } = req.body;

    if (!firstName || !email || !phone || !pickupAddress || !dropoffAddress) {
      return rv.send(res, agencyView.badRequest('firstName, email, phone, pickupAddress and dropoffAddress are required.'));
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // ── 1. Find or create client ──────────────────────────────────────────────
    let client = await User.findOne({ email: email.trim().toLowerCase() });
    let isNewClient  = false;
    let generatedPassword = null;

    if (!client) {
      generatedPassword = crypto.randomBytes(4).toString('hex') + '!@Tn';
      const apiSettings = await UserApiSettings.create({ totalCredits: 0, usedCredits: 0 });
      client = await User.create({
        firstName:         firstName.trim(),
        lastName:          (lastName || '').trim(),
        email:             email.trim().toLowerCase(),
        phone:             phone.trim(),
        password:          generatedPassword, // pre-save hook bcrypts
        role:              'user',
        agency:            req.agency._id,
        activeApiSettings: apiSettings._id,
      });
      isNewClient = true;
      logger.info(`[ClientWithDelivery] New client created: ${client._id}`);
    }

    // ── 2. Generate orderId + tracking code ───────────────────────────────────
    const ts           = Date.now().toString(36).toUpperCase();
    const rnd          = Math.random().toString(36).substr(2, 4).toUpperCase();
    const orderId      = `ORD-${ts}-${rnd}`;
    const trackingCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    // ── 3. Create delivery ────────────────────────────────────────────────────
    const broadcastExpiry = new Date(Date.now() + 60_000);
    const delivery = await Delivery.create({
      orderId,
      trackingCode,
      agency:         req.agency._id,
      client:         client._id,
      pickupAddress:  pickupAddress.trim(),
      dropoffAddress: dropoffAddress.trim(),
      packageType:    packageType || 'small',
      estimatedPrice: estimatedPrice || undefined,
      notes:          notes || '',
      clientStatus:   driverId ? 'accepted' : 'broadcasting',
      status:         'going_to_pickup',
      ...(pickupLat  !== undefined && { pickupLat:  parseFloat(pickupLat)  }),
      ...(pickupLng  !== undefined && { pickupLng:  parseFloat(pickupLng)  }),
      ...(dropoffLat !== undefined && { dropoffLat: parseFloat(dropoffLat) }),
      ...(dropoffLng !== undefined && { dropoffLng: parseFloat(dropoffLng) }),
      ...(driverId && { driver: driverId }),
      ...(!driverId && {
        broadcastedAt:      new Date(),
        broadcastExpiresAt: broadcastExpiry,
      }),
    });

    // ── 4. Broadcast or send WhatsApp ─────────────────────────────────────────
    const trackingUrl = `${frontendUrl}/track?code=${trackingCode}`;
    const loginUrl    = `${frontendUrl}/login`;
    const name        = `${client.firstName} ${client.lastName}`.trim();

    if (sendWhatsapp && phone) {
      // Pre-assigned driver — send WhatsApp immediately
      if (isNewClient) {
        await whatsappService.send(
          phone,
          `🚚 *Your delivery is ready!*\n\n` +
          `Hello ${name},\n\n` +
          `Your account has been created.\n\n` +
          `📧 *Email:* ${client.email}\n` +
          `🔐 *Password:* ${generatedPassword}\n\n` +
          `📦 *Delivery:*\n` +
          `From: ${pickupAddress}\n` +
          `To: ${dropoffAddress}\n\n` +
          `🔗 Track your delivery:\n${trackingUrl}\n\n` +
          `🔗 Login to your account:\n${loginUrl}\n\n` +
          `You can change your password after login.`
        );
      } else {
        await whatsappService.send(
          phone,
          `🚚 *New delivery created!*\n\n` +
          `Hello ${name},\n\n` +
          `📦 *Delivery:*\n` +
          `From: ${pickupAddress}\n` +
          `To: ${dropoffAddress}\n\n` +
          `🔗 Track your delivery:\n${trackingUrl}\n\n` +
          `Login with your existing credentials:\n${loginUrl}`
        );
      }
    }

    logger.info(`[ClientWithDelivery] ${orderId} | code: ${trackingCode} | client: ${client._id} | new: ${isNewClient}`);

    // TEST MODE — always return credentials so agency can share them manually
    // when WhatsApp is not configured or during development.
    const testMode = isNewClient && generatedPassword
      ? {
          clientEmail:  client.email,
          clientPassword: generatedPassword,
          trackingUrl,
          loginUrl,
          message: '⚠️ TEST MODE — WhatsApp may not be configured. Share these credentials manually.',
        }
      : null;

    return rv.send(res, rv.created({
      data: {
        client:   { id: client._id, firstName: client.firstName, email: client.email, isNewClient },
        delivery: { id: delivery._id, orderId, trackingCode, trackingUrl },
      },
      testMode,
      driversNotified: 0,
      message: isNewClient
        ? 'Client & delivery created. Credentials sent via WhatsApp.'
        : 'Delivery created for existing client. Tracking link sent via WhatsApp.',
    }));
  } catch (err) {
    logger.error(`createClientWithDelivery error: ${err.message}`);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(v => v.message);
      return rv.send(res, rv.badRequest(messages.join(', ')));
    }
    next(err);
  }
};

/**
 * @desc  Active orders with pickup/dropoff locations for the live map
 * @route GET /api/v1/agencies/me/deliveries/active-with-locations
 * @access Private (agency_admin / gestionnaire_agency)
 *
 * Queries ArmadaOrder (the collection where imported orders live).
 * Also falls back to Delivery model for manually-created deliveries.
 * Pickup coords come from Merchant.address; dropoff is the destination
 * address string which the frontend will geocode via Nominatim.
 */
exports.getActiveDeliveriesWithLocations = async (req, res, next) => {
  try {
    const ArmadaOrder = require('../../models/ArmadaOrder');
    const agencyId    = req.user.agency;

    if (!agencyId) {
      return rv.send(res, agencyView.badRequest('No agency linked to this account.'));
    }

    // Resolve all merchants for this agency (for indirect order link)
    const merchants   = await Merchant.find({ agency: agencyId }).select('_id storeName address logo');
    const merchantIds = merchants.map(m => m._id);

    // Query ArmadaOrders: direct agency field OR linked via merchant
    const armadaOrders = await ArmadaOrder.find({
      $or: [
        { agency: agencyId },
        { merchant: { $in: merchantIds } },
      ],
      status: { $nin: ['delivered', 'completed', 'cancelled', 'failed', 'returned'] },
    })
      .populate('merchant', 'storeName address logo')
      .lean();

    // Also pull manually-created Delivery records that are active
    const manualDeliveries = await Delivery.find({
      agency: agencyId,
      status: { $in: ['going_to_pickup', 'picked_up', 'on_the_way'] },
    })
      .populate('driver',   'firstName lastName avatar')
      .populate('merchant', 'storeName logo address')
      .populate('client',   'firstName lastName phone')
      .lean();

    // Shape ArmadaOrders
    const armadaData = armadaOrders.map(o => {
      const m = o.merchant;
      return {
        _id:     o._id,
        orderId: o.armadaId || o.code || null,
        status:  o.status,
        source:  'armada',
        driver:  o.driverName ? { name: o.driverName, phone: o.driverPhone || null, lat: null, lng: null } : null,
        pickup:  {
          label:   m?.storeName || '',
          address: m?.address?.street || '',
          city:    m?.address?.city   || '',
          lat:     m?.address?.lat    ?? null,
          lng:     m?.address?.lng    ?? null,
        },
        dropoff: {
          label:   o.customerName   || '',
          address: o.destinationAddress || '',
          city:    o.destinationCity    || '',
          lat:     null,
          lng:     null,
        },
        merchant: m ? { _id: m._id, name: m.storeName, logo: m.logo || null } : null,
      };
    });

    // Shape manual Delivery records
    const deliveryData = manualDeliveries.map(d => ({
      _id:     d._id,
      orderId: d.orderId || null,
      status:  d.status,
      source:  'delivery',
      driver:  d.driver ? {
        name:  `${d.driver.firstName} ${d.driver.lastName || ''}`.trim(),
        phone: null,
        lat:   d.lastLat ?? null,
        lng:   d.lastLng ?? null,
      } : null,
      pickup:  {
        label:   d.pickupLabel  || d.merchant?.storeName || '',
        address: d.pickupAddress || d.merchant?.address?.street || '',
        city:    d.merchant?.address?.city || '',
        lat:     d.pickupLat  ?? d.merchant?.address?.lat ?? null,
        lng:     d.pickupLng  ?? d.merchant?.address?.lng ?? null,
      },
      dropoff: {
        label:   d.dropoffLabel  || (d.client ? d.client.firstName : ''),
        address: d.dropoffAddress || '',
        city:    '',
        lat:     d.dropoffLat ?? null,
        lng:     d.dropoffLng ?? null,
      },
      merchant: d.merchant ? { _id: d.merchant._id, name: d.merchant.storeName, logo: d.merchant.logo || null } : null,
    }));

    const data = [...armadaData, ...deliveryData];
    console.log(`[ActiveMap] agency=${agencyId} armada=${armadaData.length} delivery=${deliveryData.length}`);

    return rv.send(res, rv.success({ count: data.length, data }));
  } catch (error) {
    next(error);
  }
};
