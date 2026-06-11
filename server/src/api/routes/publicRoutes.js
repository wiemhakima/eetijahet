/**
 * Public API Routes
 * These routes require API key authentication
 */
const express = require('express');
const { predictETA } = require('../controllers/etaController');
const { predictCombined } = require('../controllers/combinedController');
const { authenticateApiKey, requirePermission } = require('../middlewares/apiKeyMiddleware');
const deductionMiddleware = require('../middlewares/deductionMiddleware');
const loggingMiddleware = require('../middlewares/loggingMiddleware');

const router = express.Router();

/**
 * Apply API key authentication to all public routes
 */
router.use(authenticateApiKey);

/**
 * Apply logging middleware to all public routes after authentication
 * This ensures we have user information for logging
 */
router.use(loggingMiddleware);

/**
 * @route   POST /api/v1/public/eta
 * @desc    Predict ETA
 * @access  Public (with API key)
 * @requires time_estimation permission
 */
router.post('/eta', 
  requirePermission('time_estimation'), 
  deductionMiddleware, 
  predictETA
);

/**
 * @route   POST /api/v1/public/combined
 * @desc    Predict combined distance and ETA
 * @access  Public (with API key)
 * @requires combined_model permission
 */
router.post('/combined',
  requirePermission('combined_model'),
  deductionMiddleware,
  predictCombined
);

module.exports = router;
