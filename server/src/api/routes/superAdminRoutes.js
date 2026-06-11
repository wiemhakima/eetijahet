/**
 * Super-admin routes — platform-wide management
 */
const express = require('express');
const router = express.Router();

const agencyController       = require('../controllers/agencyController');
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware         = require('../middlewares/authMiddleware');

// All super-admin routes require JWT + admin role
router.use(authMiddleware.protect, authMiddleware.authorize('admin'));

router.get('/agencies',              agencyController.listAllAgencies);
router.put('/agencies/:agencyId',    agencyController.updateAgencyStatus);
router.get('/metrics',               subscriptionController.getPlatformMetrics);

module.exports = router;
