
const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserApiSettings,
  impersonateUser,
  deleteUser,
  getAdminStats,
  sendNotification,
  broadcastNotification,
  getAllNotifications,
  deleteNotification,
  // Deliveries
  getAdminDeliveries,
  getDeliveryStats,
  updateAdminDelivery,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(protect);

// Restrict access to admin role only
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private (admin only)
 */
router.get('/stats', getAdminStats);

// =====================
// User Management Routes
// =====================

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (admin only)
 */
router.get('/users', getAllUsers);

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get single user by ID
 * @access  Private (admin only)
 */
router.get('/users/:id', getUserById);

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user data
 * @access  Private (admin only)
 */
router.put('/users/:id', updateUser);

/**
 * @route   PATCH /api/v1/admin/users/:id/role
 * @desc    Update user role
 * @access  Private (admin only)
 */
router.patch('/users/:id/role', updateUserRole);

/**
 * @route   PATCH /api/v1/admin/users/:id/api-settings
 * @desc    Update user API settings (credits, limits)
 * @access  Private (admin only)
 */
router.patch('/users/:id/api-settings', updateUserApiSettings);

/**
 * @route   POST /api/v1/admin/users/:id/impersonate
 * @desc    Login as user (impersonation)
 * @access  Private (admin only)
 */
router.post('/users/:id/impersonate', impersonateUser);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user
 * @access  Private (admin only)
 */
router.delete('/users/:id', deleteUser);

// =====================
// Notification Routes
// =====================

/**
 * @route   GET /api/v1/admin/notifications
 * @desc    Get all notifications (admin view)
 * @access  Private (admin only)
 */
router.get('/notifications', getAllNotifications);

/**
 * @route   POST /api/v1/admin/notifications/send
 * @desc    Send notification to specific user
 * @access  Private (admin only)
 */
router.post('/notifications/send', sendNotification);

/**
 * @route   POST /api/v1/admin/notifications/broadcast
 * @desc    Send notification to all users (broadcast)
 * @access  Private (admin only)
 */
router.post('/notifications/broadcast', broadcastNotification);

/**
 * @route   DELETE /api/v1/admin/notifications/:id
 * @desc    Delete notification
 * @access  Private (admin only)
 */
router.delete('/notifications/:id', deleteNotification);

// =====================
// Delivery / Orders Routes
// =====================

/**
 * @route   GET /api/v1/admin/deliveries/stats
 * @desc    Stats cards for the admin orders page
 * @access  Private (admin only)
 */
router.get('/deliveries/stats', getDeliveryStats);

/**
 * @route   GET /api/v1/admin/deliveries
 * @desc    All deliveries with pagination, filters, populate
 * @access  Private (admin only)
 */
router.get('/deliveries', getAdminDeliveries);

/**
 * @route   PATCH /api/v1/admin/deliveries/:id
 * @desc    Update delivery status / assign driver
 * @access  Private (admin only)
 */
router.patch('/deliveries/:id', updateAdminDelivery);

module.exports = router;
