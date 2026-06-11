/**
 * Client Controller
 * Authenticated routes for clients (role: 'user') to view their deliveries.
 */
const Delivery = require('../../models/Delivery');
const User     = require('../../models/User');
const logger   = require('../../utils/logger');
const rv = require('../../views/responseView');
const agencyView = require('../../views/agencyView');

/**
 * @desc    Get all deliveries for the logged-in client
 * @route   GET /api/v1/client/deliveries
 * @access  Private (user)
 */
exports.getMyDeliveries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { client: req.user._id };
    if (status) filter.clientStatus = status;

    const total      = await Delivery.countDocuments(filter);
    const deliveries = await Delivery.find(filter)
      .populate('agency', 'name nameAr logo phone')
      .populate('driver', 'firstName lastName phone avatar')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return rv.send(res, agencyView.deliveryList(deliveries, { total, page: parseInt(page), limit: parseInt(limit) }));
  } catch (err) {
    logger.error(`getMyDeliveries error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Get a single delivery (client must own it)
 * @route   GET /api/v1/client/deliveries/:id
 * @access  Private (user)
 */
exports.getDeliveryDetails = async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({
      _id:    req.params.id,
      client: req.user._id,
    })
      .populate('agency', 'name nameAr logo phone address')
      .populate('driver', 'firstName lastName phone avatar');

    if (!delivery) {
      return rv.send(res, agencyView.notFound('Delivery not found'));
    }

    return rv.send(res, agencyView.delivery(delivery));
  } catch (err) {
    logger.error(`getDeliveryDetails error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Update client profile (name, phone)
 * @route   PUT /api/v1/client/profile
 * @access  Private (user)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    });

    return rv.send(res, rv.success({ data: user }));
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Change password (works for both auto-generated and user-set passwords)
 * @route   PUT /api/v1/client/change-password
 * @access  Private (user)
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return rv.send(res, rv.badRequest('currentPassword and newPassword are required'));
    }
    if (newPassword.length < 8) {
      return rv.send(res, rv.badRequest('New password must be at least 8 characters'));
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return rv.send(res, rv.notFound('User not found'));

    // For auto-created clients who have never set a password, the stored password
    // was generated at account creation. comparePassword handles bcrypt comparison.
    const isMatch = user.password ? await user.comparePassword(currentPassword) : false;
    if (!isMatch) {
      return rv.send(res, rv.badRequest('Current password is incorrect'));
    }

    user.password = newPassword; // pre-save hook will bcrypt this
    await user.save();

    return rv.send(res, rv.success({ message: 'Password changed successfully' }));
  } catch (err) {
    next(err);
  }
};
