// ============================================================
// ROUTES INDEX — All versioned routes aggregator (TypeScript)
// ============================================================
import { Router } from 'express';
import authRoutes from './authRoutes';

// TODO: convert remaining routes to TypeScript progressively
const agencyRoutes        = require('./agencyRoutes');
const deliveryRoutes      = require('./clientDeliveryRoutes');
const driverRoutes        = require('./driverDeliveryRoutes');
const adminRoutes         = require('./adminRoutes');
const notificationRoutes  = require('./notificationRoutes');
const subscriptionRoutes  = require('./subscriptionRoutes');
const apiKeyRoutes        = require('./apiKeyRoutes');
const creditRoutes        = require('./creditRoutes');
const addressRoutes       = require('./addressRoutes');
const ratingRoutes        = require('./ratingRoutes');
const earningsRoutes      = require('./earningsRoutes');
const trackingRoutes      = require('./trackingRoutes');
const routingRoutes       = require('./routingRoutes');
const etaRoutes           = require('./etaRoutes');
const usageRoutes         = require('./usageRoutes');
const requestLogRoutes    = require('./requestLogRoutes');
const merchantRoutes      = require('./merchantRoutes');
const publicRoutes        = require('./publicRoutes');
const superAdminRoutes    = require('./superAdminRoutes');
const parcelRoutes        = require('./parcelRoutes');
const agencySettingsRoutes = require('./agencySettingsRoutes');

const router = Router();

// ─── Auth ────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ─── Agency ──────────────────────────────────────────────────
router.use('/agencies', agencyRoutes);
router.use('/agencies/me/settings', agencySettingsRoutes);

// ─── Deliveries ──────────────────────────────────────────────
router.use('/deliveries', deliveryRoutes);
router.use('/driver/deliveries', driverRoutes);

// ─── Admin ───────────────────────────────────────────────────
router.use('/admin', adminRoutes);
router.use('/super-admin', superAdminRoutes);

// ─── Merchant ────────────────────────────────────────────────
router.use('/merchant', merchantRoutes);

// ─── Developer ───────────────────────────────────────────────
router.use('/api-keys', apiKeyRoutes);
router.use('/credits', creditRoutes);
router.use('/usage', usageRoutes);
router.use('/logs', requestLogRoutes);
router.use('/public', publicRoutes);

// ─── Routing & ETA ───────────────────────────────────────────
router.use('/routing', routingRoutes);
router.use('/eta', etaRoutes);

// ─── Tracking ────────────────────────────────────────────────
router.use('/track', trackingRoutes);

// ─── Notifications ───────────────────────────────────────────
router.use('/notifications', notificationRoutes);

// ─── Subscriptions ───────────────────────────────────────────
router.use('/subscriptions', subscriptionRoutes);

// ─── Misc ────────────────────────────────────────────────────
router.use('/addresses', addressRoutes);
router.use('/ratings', ratingRoutes);
router.use('/earnings', earningsRoutes);
router.use('/parcels', parcelRoutes);

// Health
router.get('/status', (_req, res) => res.json({ status: 'ok' }));

export default router;
