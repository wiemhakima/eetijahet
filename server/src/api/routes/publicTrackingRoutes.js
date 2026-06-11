/**
 * Public Tracking Routes — no authentication required.
 * Rate limited to 60 requests/minute per IP.
 */
const express   = require('express');
const rateLimit = require('express-rate-limit');
const { trackByToken } = require('../controllers/publicTrackingController');

const router = express.Router();

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

router.get('/:token', trackingLimiter, trackByToken);

module.exports = router;
