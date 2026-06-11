/**
 * Finances controller — revenue and financial reporting for agency admins (pro plan).
 */
const mongoose    = require('mongoose');
const Delivery    = require('../../models/Delivery');
const ArmadaOrder = require('../../models/ArmadaOrder');
const Merchant    = require('../../models/Merchant');
const rv = require('../../views/responseView');
const statsView = require('../../views/statsView');

/**
 * @desc  Get financial summary for the agency
 * @route GET /api/v1/agencies/me/finances
 * @access Private (agency_admin / gestionnaire_agency, pro plan)
 */
exports.getFinances = async (req, res, next) => {
  try {
    const agencyId = req.user.agency;
    const now      = new Date();

    // ── 1. agency id ─────────────────────────────────────────────────────────
    console.log('[Finances] req.user.agency:', agencyId, agencyId ? '✓' : '✗ NULL/UNDEFINED');

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    console.log('[Finances] period:', startOfMonth.toISOString(), '→', endOfMonth.toISOString());

    // ── 2. merchants linked to this agency ───────────────────────────────────
    const merchants   = await Merchant.find({ agency: agencyId }).select('_id');
    const merchantIds = merchants.map(m => m._id);
    console.log('[Finances] merchants found:', merchants.length, merchantIds.map(String));

    // ArmadaOrder filter: direct agency field OR via merchant
    const orderFilter = {
      $or: [
        { agency: agencyId },
        { merchant: { $in: merchantIds } },
      ],
    };

    // ── 3. monthly Deliveries (status=delivered, current month) ──────────────
    const [monthlyDeliveries, monthlyOrders] = await Promise.all([
      Delivery.find({
        agency:    agencyId,
        status:    'delivered',
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }).select('estimatedPrice createdAt merchant'),
      ArmadaOrder.find({
        ...orderFilter,
        status:    'completed',
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }).select('commissionAmount productAmount createdAt merchant'),
    ]);

    console.log('[Finances] monthly Deliveries (delivered, this month):', monthlyDeliveries.length);
    console.log('[Finances] monthly ArmadaOrders (delivered, this month):', monthlyOrders.length);

    // ── 4. sample first records to check field values ────────────────────────
    if (monthlyDeliveries.length > 0) {
      const s = monthlyDeliveries[0];
      console.log('[Finances] Delivery sample → estimatedPrice:', s.estimatedPrice, '| merchant:', s.merchant, '| createdAt:', s.createdAt);
    } else {
      // check without date filter to see if any delivered deliveries exist at all
      const anyDelivered = await Delivery.countDocuments({ agency: agencyId, status: 'delivered' });
      console.log('[Finances] Delivery – total delivered (no date filter):', anyDelivered);
    }

    if (monthlyOrders.length > 0) {
      const s = monthlyOrders[0];
      console.log('[Finances] ArmadaOrder sample → commissionAmount:', s.commissionAmount, '| merchant:', s.merchant, '| createdAt:', s.createdAt);
    } else {
      const anyDelivered = await ArmadaOrder.countDocuments({ ...orderFilter, status: 'completed' });
      console.log('[Finances] ArmadaOrder – total completed (no date filter):', anyDelivered);
    }

    const deliveryRevenue = monthlyDeliveries.reduce((sum, d) => sum + (d.estimatedPrice   || 0), 0);
    const orderRevenue    = monthlyOrders.reduce(    (sum, o) => sum + (o.commissionAmount || 0), 0);
    const monthlyRevenue  = deliveryRevenue + orderRevenue;

    console.log('[Finances] deliveryRevenue:', deliveryRevenue, '| orderRevenue:', orderRevenue, '| monthlyRevenue:', monthlyRevenue);


    // Monthly revenue breakdown — last 6 months
    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const [dList, oList] = await Promise.all([
        Delivery.find({ agency: agencyId, status: 'delivered', createdAt: { $gte: start, $lte: end } }).select('estimatedPrice'),
        ArmadaOrder.find({ ...orderFilter, status: 'completed', createdAt: { $gte: start, $lte: end } }).select('commissionAmount'),
      ]);
      const revenue = dList.reduce((s, d) => s + (d.estimatedPrice   || 0), 0)
                    + oList.reduce((s, o) => s + (o.commissionAmount || 0), 0);
      monthlyBreakdown.push({
        month:   start.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenue: Math.round(revenue * 100) / 100,
        count:   dList.length + oList.length,
      });
    }

    // Revenue by merchant — top 5 (from ArmadaOrder which has commissionAmount)
    const agencyOid = new mongoose.Types.ObjectId(agencyId);
    const revenueByMerchant = await ArmadaOrder.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                { agency: agencyOid },
                { merchant: { $in: merchantIds } },
              ],
            },
            {
              status:    'completed',
              merchant:  { $ne: null },
              createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            },
          ],
        },
      },
      { $group: { _id: '$merchant', revenue: { $sum: '$commissionAmount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'merchants', localField: '_id', foreignField: '_id', as: 'merchantInfo' } },
      { $unwind: { path: '$merchantInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id:     0,
          name:    { $ifNull: ['$merchantInfo.storeName', 'Unknown'] },
          revenue: { $round: ['$revenue', 2] },
          count:   1,
        },
      },
    ]);

    // Total all-time revenue (both collections)
    const [allDeliveries, allOrders] = await Promise.all([
      Delivery.find({ agency: agencyId, status: 'delivered' }).select('estimatedPrice'),
      ArmadaOrder.find({ ...orderFilter, status: 'completed' }).select('commissionAmount'),
    ]);
    const totalRevenue = allDeliveries.reduce((s, d) => s + (d.estimatedPrice   || 0), 0)
                       + allOrders.reduce(    (s, o) => s + (o.commissionAmount || 0), 0);

    return rv.send(res, statsView.finances({
      totalRevenue:      Math.round(totalRevenue * 100) / 100,
      monthlyRevenue:    Math.round(monthlyRevenue * 100) / 100,
      monthlyDeliveries: monthlyDeliveries.length + monthlyOrders.length,
      monthlyBreakdown,
      revenueByMerchant,
      currency:          req.agency?.currency || 'KWD',
    }));
  } catch (error) {
    next(error);
  }
};
