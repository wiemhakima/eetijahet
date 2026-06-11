
const express = require('express');
const router = express.Router();

const agencyController       = require('../controllers/agencyController');
const statisticsController   = require('../controllers/statisticsController');
const financesController     = require('../controllers/financesController');
const authMiddleware         = require('../middlewares/authMiddleware');
const tenantMiddleware       = require('../middlewares/tenantMiddleware');
const {
  checkDeliveryLimit,
  checkMerchantLimit,
  checkFeature,
} = require('../middlewares/checkSubscription');

// ── Public (no auth required) ─────────────────────────────────────────────────

// Onboarding — create a new agency + owner account (starts 14-day trial)
router.post('/register', agencyController.register);

// Kuwait marketplace — list active agencies publicly
router.get('/public', agencyController.getPublicAgencies);

// ── Agency admin (JWT + tenant resolved) ─────────────────────────────────────

router.use(authMiddleware.protect, tenantMiddleware.resolveTenant);

// Agency profile
router.get('/me',     tenantMiddleware.requireAgencyAdmin, agencyController.getMyAgency);
router.put('/me',     tenantMiddleware.requireAgencyAdmin, agencyController.updateMyAgency);

// Client management
router.get(  '/me/clients',                      tenantMiddleware.requireAgencyAdmin, agencyController.listClients);
router.post( '/me/clients',                      tenantMiddleware.requireAgencyAdmin, agencyController.inviteClient);
router.post( '/me/clients/invite',               tenantMiddleware.requireAgencyAdmin, agencyController.inviteClient);
router.post( '/me/clients-with-delivery',        tenantMiddleware.requireAgencyAdmin, agencyController.createClientWithDelivery);

// Delivery management
router.get(  '/me/deliveries/active-with-locations', tenantMiddleware.requireAgencyAccess, agencyController.getActiveDeliveriesWithLocations);
router.get(  '/me/deliveries',            tenantMiddleware.requireAgencyAccess, agencyController.listDeliveries);
router.post( '/me/deliveries',            tenantMiddleware.requireAgencyAdmin, checkDeliveryLimit, agencyController.createClientDelivery);
router.put(  '/me/deliveries/:deliveryId/assign', tenantMiddleware.requireAgencyAdmin, agencyController.assignDelivery);

// Analytics — plan-gated
router.get(  '/me/statistics',            tenantMiddleware.requireAgencyAccess, checkFeature('statistics'), statisticsController.getStatistics);
router.get(  '/me/finances',              tenantMiddleware.requireAgencyAccess, checkFeature('finances'),   financesController.getFinances);

// Stats
router.get(  '/me/stats',                 tenantMiddleware.requireAgencyAccess, agencyController.getStats);

// Merchants
router.get(  '/me/merchants/with-stats',  tenantMiddleware.requireAgencyAccess, agencyController.listMerchants);
router.get(  '/me/merchants',             tenantMiddleware.requireAgencyAccess, agencyController.listMerchants);

module.exports = router;
