const express = require('express');
const { protect, requireSuperAdmin } = require('../../api/middlewares/authMiddleware');

const router = express.Router();

// All /saas routes require a valid JWT and super_admin role
router.use(protect, requireSuperAdmin);

// GET /saas/agencies — list all agencies on the platform
router.get('/agencies', async (req, res, next) => {
  try {
    const Agency = require('../../models/Agency');
    const agencies = await Agency.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: agencies });
  } catch (err) {
    next(err);
  }
});

// GET /saas/agencies/:agencyId/orders — all orders for a given agency
router.get('/agencies/:agencyId/orders', async (req, res, next) => {
  try {
    const ArmadaOrder = require('../../models/ArmadaOrder');
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { agency: req.params.agencyId };
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      ArmadaOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('merchant', 'storeName'),
      ArmadaOrder.countDocuments(filter),
    ]);
    return res.json({ success: true, data: orders, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /saas/agencies/:agencyId/merchants — all merchants for a given agency
router.get('/agencies/:agencyId/merchants', async (req, res, next) => {
  try {
    const Merchant = require('../../models/Merchant');
    const merchants = await Merchant.find({ agency: req.params.agencyId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: merchants });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
