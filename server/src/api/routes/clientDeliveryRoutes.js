/**
 * Client Delivery Routes — JWT authenticated (no API key)
 *
 * POST   /api/v1/deliveries/estimate   — Estimate distance, ETA, price
 * POST   /api/v1/deliveries            — Create delivery order
 * GET    /api/v1/deliveries            — List client's deliveries
 * GET    /api/v1/deliveries/:id        — Get single delivery
 * PUT    /api/v1/deliveries/:id/cancel — Cancel a delivery
 */
const express  = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  estimateDelivery,
  createDelivery,
  getDeliveries,
  getDelivery,
  cancelDelivery,
} = require('../controllers/clientDeliveryController');

const router = express.Router();

router.use(protect);

router.post('/estimate',  estimateDelivery);
router.post('/',          createDelivery);
router.get('/',           getDeliveries);
router.get('/:id',        getDelivery);
router.put('/:id/cancel', cancelDelivery);

module.exports = router;
