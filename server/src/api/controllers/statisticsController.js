/**
 * Statistics controller — analytics for agency admins (medium + pro plans).
 */
const mongoose    = require('mongoose');
const Delivery    = require('../../models/Delivery');
const ArmadaOrder = require('../../models/ArmadaOrder');
const User        = require('../../models/User');
const Merchant    = require('../../models/Merchant');
const rv = require('../../views/responseView');
const statsView = require('../../views/statsView');

/**
 * @desc  Get delivery statistics and trends for the agency
 * @route GET /api/v1/agencies/me/statistics
 * @access Private (agency_admin / gestionnaire_agency, medium/pro plan)
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const agencyId = req.user.agency;
    const now      = new Date();

    console.log('[Stats] user agency:', agencyId);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Resolve merchants for indirect order link (merchant.agency = agencyId)
    const merchants   = await Merchant.find({ agency: agencyId }).select('_id');
    const merchantIds = merchants.map(m => m._id);

    // ArmadaOrder filter: direct agency field OR via merchant
    const orderFilter = {
      $or: [
        { agency: agencyId },
        { merchant: { $in: merchantIds } },
      ],
    };

    const [
      deliveriesCount,
      ordersCount,
      monthlyDeliveries,
      monthlyOrders,
      totalMerchants,
      deliveredDeliveries,
      deliveredOrders,
      cancelledDeliveries,
      cancelledOrders,
    ] = await Promise.all([
      Delivery.countDocuments({ agency: agencyId }),
      ArmadaOrder.countDocuments(orderFilter),
      Delivery.countDocuments({ agency: agencyId, createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      ArmadaOrder.countDocuments({ ...orderFilter, createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      Merchant.countDocuments({ agency: agencyId }),
      Delivery.countDocuments({ agency: agencyId, status: 'delivered' }),
      ArmadaOrder.countDocuments({ ...orderFilter, status: 'delivered' }),
      Delivery.countDocuments({ agency: agencyId, status: 'cancelled' }),
      ArmadaOrder.countDocuments({ ...orderFilter, status: 'cancelled' }),
    ]);

    const totalDeliveries = deliveriesCount + ordersCount;
    const monthlyTotal    = monthlyDeliveries + monthlyOrders;
    const deliveredCount  = deliveredDeliveries + deliveredOrders;
    const cancelledCount  = cancelledDeliveries + cancelledOrders;

    console.log('[Stats] orders found:', ordersCount);
    console.log('[Stats] deliveries found:', deliveriesCount);

    const successRate = totalDeliveries > 0
      ? Math.round((deliveredCount / totalDeliveries) * 100)
      : 0;

    // Monthly delivery trend — last 6 months (both collections combined)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const [dCount, oCount] = await Promise.all([
        Delivery.countDocuments({ agency: agencyId, createdAt: { $gte: start, $lte: end } }),
        ArmadaOrder.countDocuments({ ...orderFilter, createdAt: { $gte: start, $lte: end } }),
      ]);
      monthlyTrend.push({
        month: start.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        count: dCount + oCount,
      });
    }

    return rv.send(res, statsView.overview({
      totalDeliveries,
      monthlyDeliveries: monthlyTotal,
      activeDrivers: 0,
      totalMerchants,
      deliveredCount,
      cancelledCount,
      successRate,
      monthlyTrend,
      topDrivers: [],
    }));
  } catch (error) {
    next(error);
  }
};
