// Controller Developer — MVC strict.
// Responsabilité : recevoir req → appeler Model → retourner View.
// Aucun formatage JSON direct (tout passe par developerView).

const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const UserApiSettings = require('../models/UserApiSettings');
const Notification    = require('../models/Notification');
const config   = require('../config');
const logger   = require('../utils/logger');
const view     = require('../views/developerView');
const rv       = require('../views/responseView');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const _findDeveloper = (id) =>
  User.findById(id).populate('activeApiSettings').select('-password');

const _makeImpersonationToken = (user, adminId) =>
  jwt.sign(
    { id: user._id, role: user.role, isImpersonation: true, impersonatedBy: adminId },
    config.jwt.secret,
    { expiresIn: '15m' }
  );

// ─── Controller methods ───────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/developers
 * Liste les developers avec pagination, recherche, filtre tier.
 */
exports.list = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const filter = { role: 'developer' };

    if (req.query.search) {
      const rx = new RegExp(req.query.search, 'i');
      filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
    }

    if (req.query.tier) filter.tier = req.query.tier;

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .populate('activeApiSettings')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return rv.send(res, view.list(users, { total, page, limit, pages: Math.ceil(total / limit) }));
  } catch (err) {
    logger.error(`developerController.list: ${err.message}`);
    next(err);
  }
};

/**
 * GET /api/v1/admin/developers/:id
 */
exports.getOne = async (req, res, next) => {
  try {
    const user = await _findDeveloper(req.params.id);
    if (!user) return rv.send(res, view.notFound());
    return rv.send(res, view.one(user));
  } catch (err) {
    logger.error(`developerController.getOne: ${err.message}`);
    next(err);
  }
};

/**
 * PUT /api/v1/admin/developers/:id
 * Modifie les données d'un developer.
 */
exports.update = async (req, res, next) => {
  try {
    const { firstName, lastName, email, tier, totalCredits } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return rv.send(res, view.notFound());

    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) return rv.send(res, view.badRequest('Email already in use'));
    }

    if (firstName)           user.firstName = firstName;
    if (lastName)            user.lastName  = lastName;
    if (email)               user.email     = email;
    if (tier)                user.tier      = tier;
    await user.save();

    if (totalCredits !== undefined && user.activeApiSettings) {
      await UserApiSettings.findByIdAndUpdate(user.activeApiSettings, { totalCredits });
    }

    const updated = await _findDeveloper(user._id);
    logger.info(`Admin ${req.user.email} updated developer ${user.email}`);
    return rv.send(res, view.saved(updated));
  } catch (err) {
    logger.error(`developerController.update: ${err.message}`);
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/developers/:id
 */
exports.remove = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString())
      return rv.send(res, view.badRequest('You cannot delete your own account'));

    const user = await User.findById(req.params.id);
    if (!user) return rv.send(res, view.notFound());

    if (user.activeApiSettings)
      await UserApiSettings.findByIdAndDelete(user.activeApiSettings);

    await User.findByIdAndDelete(req.params.id);
    logger.info(`Admin ${req.user.email} deleted developer ${user.email}`);
    return rv.send(res, view.deleted());
  } catch (err) {
    logger.error(`developerController.remove: ${err.message}`);
    next(err);
  }
};

/**
 * POST /api/v1/admin/developers/:id/impersonate
 */
exports.impersonate = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString())
      return rv.send(res, view.badRequest('You cannot impersonate yourself'));

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return rv.send(res, view.notFound());

    const token = _makeImpersonationToken(user, req.user._id);
    logger.warn(`SECURITY: Admin ${req.user.email} impersonated developer ${user.email}`);
    return rv.send(res, view.impersonated(user, token));
  } catch (err) {
    logger.error(`developerController.impersonate: ${err.message}`);
    next(err);
  }
};

/**
 * POST /api/v1/admin/developers/:id/notify
 */
exports.notify = async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message)
      return rv.send(res, view.badRequest('title and message are required'));

    const user = await User.findById(req.params.id);
    if (!user) return rv.send(res, view.notFound());

    await Notification.create({
      title, message,
      type: type || 'info',
      user: req.params.id,
      global: false,
      isRead: false,
    });

    logger.info(`Admin ${req.user.email} notified developer ${user.email}`);
    return rv.send(res, rv.success({ sent: true }));
  } catch (err) {
    logger.error(`developerController.notify: ${err.message}`);
    next(err);
  }
};
