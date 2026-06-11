const express = require('express');
const { protect, requireMerchantSelf } = require('../../api/middlewares/authMiddleware');

const router = express.Router();

// All /merchant routes require JWT + merchant role
router.use(protect, requireMerchantSelf);

// GET /merchant/orders — own orders only
router.get('/orders', async (req, res, next) => {
  try {
    const Merchant = require('../../models/Merchant');
    const ArmadaOrder = require('../../models/ArmadaOrder');
    const merchantDoc = await Merchant.findOne({ user: req.user._id });
    if (!merchantDoc) return res.status(404).json({ success: false, error: 'Merchant profile not found' });

    const { status, page = 1, limit = 50 } = req.query;
    const filter = { merchant: merchantDoc._id };
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      ArmadaOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ArmadaOrder.countDocuments(filter),
    ]);
    return res.json({ success: true, data: orders, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /merchant/stats — own stats only
router.get('/stats', async (req, res, next) => {
  try {
    const Merchant = require('../../models/Merchant');
    const ArmadaOrder = require('../../models/ArmadaOrder');
    const merchantDoc = await Merchant.findOne({ user: req.user._id });
    if (!merchantDoc) return res.status(404).json({ success: false, error: 'Merchant profile not found' });

    const [agg] = await ArmadaOrder.aggregate([
      { $match: { merchant: merchantDoc._id } },
      {
        $group: {
          _id: null,
          totalOrders:     { $sum: 1 },
          delivered:       { $sum: { $cond: [{ $in: ['$status', ['delivered', 'completed']] }, 1, 0] } },
          active:          { $sum: { $cond: [{ $not: { $in: ['$status', ['delivered', 'completed', 'cancelled']] } }, 1, 0] } },
          totalRevenue:    { $sum: '$productAmount' },
          totalCommission: { $sum: '$commissionAmount' },
        },
      },
    ]);
    return res.json({ success: true, data: agg || {} });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
