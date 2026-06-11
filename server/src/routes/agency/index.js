const express = require('express');
const {
  protect,
  requireAgencyAccess,
  requireAgencyAdmin,
} = require('../../api/middlewares/authMiddleware');

const router = express.Router();

// All /agency routes require JWT + agency-scoped role
router.use(protect, requireAgencyAccess);

// ── Orders (agency_admin + gestionnaire_agency) ───────────────────────────────

// GET /agency/orders
router.get('/orders', async (req, res, next) => {
  try {
    const ArmadaOrder = require('../../models/ArmadaOrder');
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { agency: req.user.agency };
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

// GET /agency/merchants — view merchant list (both roles)
router.get('/merchants', async (req, res, next) => {
  try {
    const Merchant = require('../../models/Merchant');
    const merchants = await Merchant.find({ agency: req.user.agency }).sort({ createdAt: -1 });
    return res.json({ success: true, data: merchants });
  } catch (err) {
    next(err);
  }
});

// ── Admin-only below this line ────────────────────────────────────────────────
router.use(requireAgencyAdmin);

// GET /agency/finances
router.get('/finances', async (req, res, next) => {
  try {
    const ArmadaOrder = require('../../models/ArmadaOrder');
    const [agg] = await ArmadaOrder.aggregate([
      { $match: { agency: req.user.agency } },
      {
        $group: {
          _id: null,
          totalProductAmount:  { $sum: '$productAmount' },
          totalDeliveryFee:    { $sum: '$deliveryFee' },
          totalCommission:     { $sum: '$commissionAmount' },
          orderCount:          { $sum: 1 },
        },
      },
    ]);
    return res.json({ success: true, data: agg || {} });
  } catch (err) {
    next(err);
  }
});

// POST /agency/merchants — create merchant (admin only)
router.post('/merchants', async (req, res, next) => {
  try {
    const Merchant = require('../../models/Merchant');
    const merchant = await Merchant.create({ ...req.body, agency: req.user.agency });
    return res.status(201).json({ success: true, data: merchant });
  } catch (err) {
    next(err);
  }
});

// DELETE /agency/merchants/:id — delete merchant (admin only)
router.delete('/merchants/:id', async (req, res, next) => {
  try {
    const Merchant = require('../../models/Merchant');
    const merchant = await Merchant.findOneAndDelete({ _id: req.params.id, agency: req.user.agency });
    if (!merchant) return res.status(404).json({ success: false, error: 'Merchant not found' });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PUT /agency/settings — change agency settings (admin only)
router.put('/settings', async (req, res, next) => {
  try {
    const Agency = require('../../models/Agency');
    const agency = await Agency.findByIdAndUpdate(req.user.agency, req.body, { new: true, runValidators: true });
    if (!agency) return res.status(404).json({ success: false, error: 'Agency not found' });
    return res.json({ success: true, data: agency });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
