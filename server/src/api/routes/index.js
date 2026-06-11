/**
 * API Routes
 */
const express = require('express');
const etaRoutes = require('./etaRoutes');
const statusRoutes = require('./statusRoutes');
const authRoutes = require('./authRoutes');
const apiKeyRoutes = require('./apiKeyRoutes');
const publicRoutes = require('./publicRoutes');
const requestLogRoutes = require('./requestLogRoutes');
const usageRoutes = require('./usageRoutes');
const creditRoutes = require('./creditRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes          = require('./adminRoutes');
const adminRoutingRoutes   = require('./adminRoutingRoutes');
const routingRoutes        = require('./routingRoutes');
const clientDeliveryRoutes = require('./clientDeliveryRoutes');
const parcelRoutes         = require('./parcelRoutes');
const addressRoutes        = require('./addressRoutes');
const ratingRoutes         = require('./ratingRoutes');
const agencyRoutes         = require('./agencyRoutes');
const agencySettingsRoutes = require('./agencySettingsRoutes');
const subscriptionRoutes   = require('./subscriptionRoutes');
const superAdminRoutes     = require('./superAdminRoutes');
const clientRoutes         = require('./clientRoutes');
const merchantRoutes       = require('./merchantRoutes');
const armadaRoutes            = require('./armadaRoutes');
const publicTrackingRoutes    = require('./publicTrackingRoutes');
const authMiddleware          = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes (no authentication required)
router.use('/status', statusRoutes);
router.use('/auth', authRoutes);
router.use('/track', publicTrackingRoutes);

// Public routes (API key required)
router.use('/public', publicRoutes);

// Routing routes (API key required)
router.use('/routing', routingRoutes);

// Protected routes (JWT authentication required)
router.use('/api-keys', authMiddleware.protect, apiKeyRoutes);
router.use('/logs', authMiddleware.protect, requestLogRoutes);
router.use('/usage', authMiddleware.protect, usageRoutes);
router.use('/credits', authMiddleware.protect, creditRoutes);
router.use('/notifications', notificationRoutes);

// Client delivery routes (JWT required)
router.use('/deliveries', clientDeliveryRoutes);

// Client-specific routes (role: user)
router.use('/client', clientRoutes);

// Parcel routes — admin only
router.use('/parcels', parcelRoutes);

// Client address routes (JWT required)
router.use('/addresses', addressRoutes);

// Rating routes (JWT required)
router.use('/ratings', ratingRoutes);

// Admin routes (admin only)
router.use('/admin', adminRoutes);
router.use('/admin/routing', adminRoutingRoutes);

// Agency routes (onboarding + agency management)
router.use('/agencies', agencyRoutes);

// Agency settings routes (profile, zones, hours, team, notifications)
router.use('/agencies/me', agencySettingsRoutes);

// Subscription routes (plan management)
router.use('/subscriptions', subscriptionRoutes);

// Super-admin routes (platform-wide)
router.use('/super-admin', superAdminRoutes);

// Merchant routes (agency admin + merchant user)
router.use('/', merchantRoutes);

// Armada Delivery integration
router.use('/orders', armadaRoutes);

// Legacy routes - will be deprecated
router.use('/eta', etaRoutes);

module.exports = router;
