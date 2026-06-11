const jwt      = require('jsonwebtoken');
const User     = require('../../models/User');
const Delivery = require('../../models/Delivery');
const UserApiSettings = require('../../models/UserApiSettings');
const Notification    = require('../../models/Notification');
const config   = require('../../config');
const logger   = require('../../utils/logger');
const socket   = require('../../socket');
const rv = require('../../views/responseView');
const adminView = require('../../views/adminView');

/**
 * Generate JWT token for impersonation
 * Uses a SHORT expiration time for security
 * @param {Object} user - User object
 * @param {String} adminId - ID of the admin performing impersonation
 * @returns {String} JWT token
 */
const generateImpersonationToken = (user, adminId) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      // Mark this as an impersonation token for audit/security
      isImpersonation: true,
      impersonatedBy: adminId,
      impersonatedAt: new Date().toISOString()
    },
    config.jwt.secret,
    // SHORT expiration - 15 minutes only for security
    // If someone intercepts the token, it will expire quickly
    { expiresIn: '15m' }
  );
};

/**
 * @desc    Get all users with pagination and filtering
 * @route   GET /api/v1/admin/users
 * @access  Private (admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { company: searchRegex }
      ];
    }

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.tier) {
      filter.tier = req.query.tier;
    }

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Get users with populated API settings
    const users = await User.find(filter)
      .populate('activeApiSettings')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return rv.send(res, adminView.userList(users, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }));
  } catch (error) {
    logger.error(`Get all users error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/v1/admin/users/:id
 * @access  Private (admin only)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('activeApiSettings')
      .select('-password');

    if (!user) {
      return rv.send(res, adminView.notFound('User not found'));
    }

    return rv.send(res, adminView.user(user));
  } catch (error) {
    logger.error(`Get user by ID error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update user data
 * @route   PUT /api/v1/admin/users/:id
 * @access  Private (admin only)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, company, role, tier } = req.body;

    // Find user
    const user = await User.findById(req.params.id);

    if (!user) {
      return rv.send(res, adminView.notFound('User not found'));
    }

    // Check if email is being changed and already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return rv.send(res, adminView.badRequest('Email already in use'));
      }
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (company !== undefined) user.company = company;
    if (role) user.role = role;
    if (tier) user.tier = tier;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(user._id)
      .populate('activeApiSettings')
      .select('-password');

    logger.info(`Admin ${req.user.email} updated user ${user.email}`);

    return rv.send(res, adminView.userSaved(updatedUser));
  } catch (error) {
    logger.error(`Update user error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update user role
 * @route   PATCH /api/v1/admin/users/:id/role
 * @access  Private (admin only)
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return rv.send(res, adminView.badRequest('Invalid role. Must be "user" or "admin"'));
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return rv.send(res, adminView.badRequest('You cannot change your own role'));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).populate('activeApiSettings').select('-password');

    if (!user) {
      return rv.send(res, adminView.notFound('User not found'));
    }

    logger.info(`Admin ${req.user.email} changed role of ${user.email} to ${role}`);

    return rv.send(res, adminView.userSaved(user));
  } catch (error) {
    logger.error(`Update user role error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update user API settings (credits, limits)
 * @route   PATCH /api/v1/admin/users/:id/api-settings
 * @access  Private (admin only)
 */
exports.updateUserApiSettings = async (req, res, next) => {
  try {
    const { totalCredits, requestsPerMinute, requestsPerHour, requestsPerDay, concurrentRequests } = req.body;

    const user = await User.findById(req.params.id).populate('activeApiSettings');

    if (!user) {
      return rv.send(res, adminView.notFound('User not found'));
    }

    if (!user.activeApiSettings) {
      return rv.send(res, adminView.notFound('User API settings not found'));
    }

    // Update API settings
    const settings = user.activeApiSettings;
    if (totalCredits !== undefined) settings.totalCredits = totalCredits;
    if (requestsPerMinute !== undefined) settings.requestsPerMinute = requestsPerMinute;
    if (requestsPerHour !== undefined) settings.requestsPerHour = requestsPerHour;
    if (requestsPerDay !== undefined) settings.requestsPerDay = requestsPerDay;
    if (concurrentRequests !== undefined) settings.concurrentRequests = concurrentRequests;

    await settings.save();

    logger.info(`Admin ${req.user.email} updated API settings for ${user.email}`);

    return rv.send(res, adminView.stats(settings));
  } catch (error) {
    logger.error(`Update user API settings error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Login as user (impersonation)
 * @route   POST /api/v1/admin/users/:id/impersonate
 * @access  Private (admin only)
 */
exports.impersonateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return rv.send(res, adminView.notFound('User not found'));
    }

    // Prevent impersonating yourself
    if (req.params.id === req.user._id.toString()) {
      return rv.send(res, adminView.badRequest('You cannot impersonate yourself'));
    }

    // Generate a SHORT-LIVED impersonation token (15 minutes)
    // This token includes metadata about who performed the impersonation
    const token = generateImpersonationToken(user, req.user._id);

    // Log the impersonation action for audit trail
    logger.warn(`SECURITY: Admin ${req.user.email} (ID: ${req.user._id}) impersonated user ${user.email} (ID: ${user._id})`);

    return rv.send(res, adminView.impersonated(user, token));
  } catch (error) {
    logger.error(`Impersonate user error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private (admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return rv.send(res, adminView.badRequest('You cannot delete your own account'));
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return rv.send(res, adminView.notFound('User not found'));
    }

    // Delete user's API settings
    if (user.activeApiSettings) {
      await UserApiSettings.findByIdAndDelete(user.activeApiSettings);
    }

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    logger.info(`Admin ${req.user.email} deleted user ${user.email}`);

    return rv.send(res, adminView.userDeleted());
  } catch (error) {
    logger.error(`Delete user error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get admin statistics
 * @route   GET /api/v1/admin/stats
 * @access  Private (admin only)
 */
exports.getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // Users by tier
    const freeTierUsers = await User.countDocuments({ tier: 'free' });
    const basicTierUsers = await User.countDocuments({ tier: 'basic' });
    const premiumTierUsers = await User.countDocuments({ tier: 'premium' });
    const enterpriseTierUsers = await User.countDocuments({ tier: 'enterprise' });

    // Recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Unread notifications count
    const unreadNotifications = await Notification.countDocuments({ isRead: false });

    return rv.send(res, adminView.stats({
      users: {
        total: totalUsers,
        admins: adminUsers,
        regular: regularUsers,
        recentSignups: recentUsers
      },
      tiers: {
        free: freeTierUsers,
        basic: basicTierUsers,
        premium: premiumTierUsers,
        enterprise: enterpriseTierUsers
      },
      notifications: {
        unread: unreadNotifications
      }
    }));
  } catch (error) {
    logger.error(`Get admin stats error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Send notification to specific user
 * @route   POST /api/v1/admin/notifications/send
 * @access  Private (admin only)
 */
exports.sendNotification = async (req, res, next) => {
  try {
    const { title, message, type, userId } = req.body;

    if (!title || !message) {
      return rv.send(res, adminView.badRequest('Title and message are required'));
    }

    if (!userId) {
      return rv.send(res, adminView.badRequest('User ID is required'));
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return rv.send(res, adminView.notFound('User not found'));
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      user: userId,
      global: false,
      isRead: false
    });

    logger.info(`Admin ${req.user.email} sent notification to ${user.email}`);

    return rv.send(res, rv.created(notification));
  } catch (error) {
    logger.error(`Send notification error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Send notification to all users (broadcast)
 * @route   POST /api/v1/admin/notifications/broadcast
 * @access  Private (admin only)
 */
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return rv.send(res, adminView.badRequest('Title and message are required'));
    }

    // Create a global notification (visible to all users)
    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      global: true,
      isRead: false
    });

    logger.info(`Admin ${req.user.email} broadcasted notification: ${title}`);

    return rv.send(res, rv.created({ data: notification, message: 'Notification broadcasted to all users' }));
  } catch (error) {
    logger.error(`Broadcast notification error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get all notifications (admin view)
 * @route   GET /api/v1/admin/notifications
 * @access  Private (admin only)
 */
const ORDER_TITLES = ['Delivered!', 'On the way', 'Package picked up'];

exports.getAllNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      title: { $nin: ORDER_TITLES }
    };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.userRole) {
      // Restrict to: global broadcasts OR notifications targeted at users with this role
      const roleUsers = await User.find({ role: req.query.userRole }).select('_id');
      const roleIds = roleUsers.map(u => u._id);
      filter.$or = [
        { global: true },
        { user: { $in: roleIds } }
      ];
    } else if (req.query.global === 'true') {
      filter.global = true;
    } else if (req.query.global === 'false') {
      filter.global = false;
    }

    const total = await Notification.countDocuments(filter);

    const notifications = await Notification.find(filter)
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return rv.send(res, rv.success({
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    logger.error(`Get all notifications error: ${error.message}`);
    next(error);
  }
};

// =====================================================================
// Delivery / Orders management (admin)
// =====================================================================

/**
 * @desc    List all deliveries with populate + filters + pagination
 * @route   GET /api/v1/admin/deliveries
 * @access  Private (admin only)
 */
exports.getAdminDeliveries = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // Build the base filter
    const match = {};

    if (req.query.status) {
      match.clientStatus = req.query.status;
    }

    if (req.query.date) {
      const start = new Date(req.query.date);
      const end   = new Date(req.query.date);
      end.setDate(end.getDate() + 1);
      match.createdAt = { $gte: start, $lt: end };
    }

    // Text search: orderId OR clients whose name/email matches
    if (req.query.search) {
      const rx = new RegExp(req.query.search, 'i');
      const matchingClients = await User.find({
        $or: [{ firstName: rx }, { lastName: rx }, { email: rx }],
      }).select('_id');
      const clientIds = matchingClients.map((u) => u._id);
      match.$or = [{ orderId: rx }, { client: { $in: clientIds } }];
    }

    const [total, deliveries] = await Promise.all([
      Delivery.countDocuments(match),
      Delivery.find(match)
        .populate('client', 'firstName lastName email')
        .populate('driver', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return rv.send(res, adminView.deliveryList(deliveries, { total, page, limit, pages: Math.ceil(total / limit) }));
  } catch (error) {
    logger.error(`getAdminDeliveries error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Stats cards (total, pending, delivering, delivered, revenue)
 * @route   GET /api/v1/admin/deliveries/stats
 * @access  Private (admin only)
 */
exports.getDeliveryStats = async (req, res, next) => {
  try {
    const [total, pending, delivering, delivered, revenueAgg] = await Promise.all([
      Delivery.countDocuments(),
      Delivery.countDocuments({ clientStatus: 'pending' }),
      Delivery.countDocuments({ clientStatus: 'in_transit' }),
      Delivery.countDocuments({ clientStatus: 'delivered' }),
      Delivery.aggregate([
        { $match: { clientStatus: 'delivered', estimatedPrice: { $exists: true } } },
        { $group: { _id: null, total: { $sum: '$estimatedPrice' } } },
      ]),
    ]);

    return rv.send(res, adminView.stats({
      total,
      pending,
      delivering,
      delivered,
      revenue: revenueAgg[0]?.total || 0,
    }));
  } catch (error) {
    logger.error(`getDeliveryStats error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update delivery status and/or assign driver
 * @route   PATCH /api/v1/admin/deliveries/:id
 * @access  Private (admin only)
 */
exports.updateAdminDelivery = async (req, res, next) => {
  try {
    const { status, driverId } = req.body;

    const update = {};
    if (status)            update.clientStatus = status;
    if (driverId !== undefined) update.driver  = driverId || null;
    if (status === 'delivered' && !update.completed_at) update.completed_at = new Date();

    const delivery = await Delivery.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('client', 'firstName lastName email')
      .populate('driver', 'firstName lastName email');

    if (!delivery) {
      return rv.send(res, adminView.notFound('Livraison introuvable'));
    }

    // Broadcast real-time event to all admin clients
    socket.emit('delivery:updated', delivery);

    logger.info(`Admin ${req.user.email} updated delivery ${delivery.orderId || delivery._id}`);

    return rv.send(res, adminView.delivery(delivery));
  } catch (error) {
    logger.error(`updateAdminDelivery error: ${error.message}`);
    next(error);
  }
};

// =====================================================================

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/admin/notifications/:id
 * @access  Private (admin only)
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return rv.send(res, adminView.notFound('Notification not found'));
    }

    logger.info(`Admin ${req.user.email} deleted notification ${req.params.id}`);

    return rv.send(res, rv.deleted('Notification deleted successfully'));
  } catch (error) {
    logger.error(`Delete notification error: ${error.message}`);
    next(error);
  }
};
