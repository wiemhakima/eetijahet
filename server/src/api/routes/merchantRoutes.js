/**
 * Merchant Routes
 *
 * /api/v1/agencies/me/merchants  — Agency admin manages merchants
 * /api/v1/merchant/*             — Merchant user manages their own orders
 */
const express = require('express');
const router = express.Router();

const authMiddleware     = require('../middlewares/authMiddleware');
const tenantMiddleware   = require('../middlewares/tenantMiddleware');
const merchantController = require('../controllers/merchantController');
const merchantOrderController = require('../controllers/merchantOrderController');
const { checkMerchantLimit } = require('../middlewares/checkSubscription');

// ── Agency admin: manage merchants ────────────────────────────────────────────
// POST   /api/v1/agencies/me/merchants
// GET    /api/v1/agencies/me/merchants
// GET    /api/v1/agencies/me/merchants/stats
// GET    /api/v1/agencies/me/merchants/:id
// PUT    /api/v1/agencies/me/merchants/:id
// DELETE /api/v1/agencies/me/merchants/:id

router.use('/agencies/me/merchants',
  authMiddleware.protect,
  tenantMiddleware.resolveTenant,
  tenantMiddleware.requireAgencyAccess,
);

router.get( '/agencies/me/merchants',                          merchantController.getMerchants);
router.get( '/agencies/me/merchants/stats',                    merchantController.getMerchantStats);
router.get( '/agencies/me/merchants/cleanup',                  merchantController.cleanupAddresses); // ONE-TIME — delete after use
router.get( '/agencies/me/merchants/with-stats',               merchantController.getMerchantsWithStats);
router.get( '/agencies/me/merchants/:merchantId/orders',       merchantController.getMerchantOrders);
router.get( '/agencies/me/merchants/:id',                      merchantController.getMerchant);
router.post('/agencies/me/merchants',                          tenantMiddleware.requireAgencyAdmin, checkMerchantLimit, merchantController.createMerchant);
router.put( '/agencies/me/merchants/:id',                      tenantMiddleware.requireAgencyAdmin, merchantController.updateMerchant);
router.delete('/agencies/me/merchants/:id',                    tenantMiddleware.requireAgencyAdmin, merchantController.deleteMerchant);

// ── Merchant user: own space ──────────────────────────────────────────────────
// GET  /api/v1/merchant/profile
// GET  /api/v1/merchant/stats
// GET  /api/v1/merchant/orders
// POST /api/v1/merchant/orders

const merchantAuth = [authMiddleware.protect, authMiddleware.authorize('merchant')];

router.get(  '/merchant/profile',          merchantAuth, merchantOrderController.getMyProfile);
router.patch('/merchant/profile',          merchantAuth, merchantOrderController.updateProfile);
router.patch('/merchant/change-password',  merchantAuth, merchantOrderController.changePassword);
router.get(  '/merchant/stats',            merchantAuth, merchantOrderController.getMyStats);
router.get( '/merchant/orders',                                 merchantAuth, merchantOrderController.getMyOrders);
router.post('/merchant/orders',                                 merchantAuth, merchantOrderController.createOrder);
router.get( '/merchant/orders/:armadaOrderId/track',            merchantAuth, merchantOrderController.trackOrder);

module.exports = router;
