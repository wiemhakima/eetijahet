/**
 * Subscription routes
 */
const express = require('express');
const router = express.Router();

const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware          = require('../middlewares/authMiddleware');
const tenantMiddleware        = require('../middlewares/tenantMiddleware');

// ── Public ────────────────────────────────────────────────────────────────────

router.get('/plans', subscriptionController.listPlans);

// ── Authenticated ─────────────────────────────────────────────────────────────

router.use(authMiddleware.protect, tenantMiddleware.resolveTenant);

// Read-only: gestionnaire can view plan info (sidebar needs it to show correct locks)
router.get('/current',  tenantMiddleware.requireAgencyAccess, subscriptionController.getCurrentSubscription);
router.get('/invoices', tenantMiddleware.requireAgencyAccess, subscriptionController.getInvoices);

// Mutations: agency owner only
router.post(  '/',          tenantMiddleware.requireAgencyAdmin, subscriptionController.subscribe);
router.put(   '/current',   tenantMiddleware.requireAgencyAdmin, subscriptionController.updateSubscription);
router.delete('/current',   tenantMiddleware.requireAgencyAdmin, subscriptionController.cancelSubscription);

module.exports = router;
