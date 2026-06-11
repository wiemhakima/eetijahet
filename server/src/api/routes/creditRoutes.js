/**
 * Credit Routes
 * Routes for credit management, packages, purchases, and transaction history
 */
const express = require('express');
const {
  requireDeveloper,
  getCreditsOverview,
  getPackages,
  purchaseCredits,
  getTransactions,
} = require('../controllers/creditController');

const router = express.Router();

// All credit routes are restricted to Developer accounts
router.use(requireDeveloper);

// GET /api/v1/credits - Get complete credits overview
router.get('/', getCreditsOverview);

// GET /api/v1/credits/packages - Get available credit packages
router.get('/packages', getPackages);

// POST /api/v1/credits/purchase - Purchase a credit package
router.post('/purchase', purchaseCredits);

// GET /api/v1/credits/transactions - Get paginated transaction history
router.get('/transactions', getTransactions);

module.exports = router;
