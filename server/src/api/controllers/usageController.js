/**
 * Usage Controller
 * Provides usage statistics and limits for the authenticated user
 */
const User = require('../../models/User');
const RequestLog = require('../../models/RequestLog');
const logger = require('../../utils/logger');
const rv = require('../../views/responseView');
const usageView = require('../../views/usageView');

/**
 * @desc    Get user's usage statistics and limits
 * @route   GET /api/v1/usage?timeRange=7days|30days|90days
 * @access  Private
 */
exports.getUserUsage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('activeApiSettings');

    if (!user) {
      return rv.send(res, usageView.notFound('User not found'));
    }

    if (!user.activeApiSettings) {
      return rv.send(res, usageView.notFound('API settings not found for this user'));
    }

    const apiSettings = user.activeApiSettings;

    // ── Time range ────────────────────────────────────────────────────────────
    // Respect the ?timeRange param sent by the frontend (defaults to 30 days)
    const RANGE_DAYS = { '7days': 7, '30days': 30, '90days': 90 };
    const rangeDays  = RANGE_DAYS[req.query.timeRange] || 30;

    const now        = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - rangeDays);

    // End of current month (credit refresh date)
    const refreshDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // ── Request counts (filtered by timeRange) ────────────────────────────────
    const [totalRequests, successfulRequests, failedRequests] = await Promise.all([
      RequestLog.countDocuments({ userId: user._id, requestDate: { $gte: cutoffDate, $lte: now } }),
      RequestLog.countDocuments({ userId: user._id, requestDate: { $gte: cutoffDate, $lte: now }, isSuccess: true }),
      RequestLog.countDocuments({ userId: user._id, requestDate: { $gte: cutoffDate, $lte: now }, isSuccess: false }),
    ]);

    const successRate = totalRequests > 0
      ? parseFloat(((successfulRequests / totalRequests) * 100).toFixed(2))
      : 0;

    // ── Daily credit usage (filtered by timeRange) ────────────────────────────
    const dailyCreditUsage = await RequestLog.aggregate([
      { $match: { userId: user._id, requestDate: { $gte: cutoffDate, $lte: now } } },
      {
        $group: {
          _id: { year: { $year: '$requestDate' }, month: { $month: '$requestDate' }, day: { $dayOfMonth: '$requestDate' } },
          creditsUsed: { $sum: '$creditsUsed' },
          date: { $first: '$requestDate' },
        },
      },
      { $sort: { date: 1 } },
      { $project: { _id: 0, date: { $dateToString: { format: '%b %d', date: '$date' } }, value: '$creditsUsed' } },
    ]);

    // ── Daily request history (filtered by timeRange) ─────────────────────────
    const dailyRequestHistory = await RequestLog.aggregate([
      { $match: { userId: user._id, requestDate: { $gte: cutoffDate, $lte: now } } },
      {
        $group: {
          _id: {
            year: { $year: '$requestDate' },
            month: { $month: '$requestDate' },
            day: { $dayOfMonth: '$requestDate' },
            isSuccess: '$isSuccess',
          },
          count: { $sum: 1 },
          date: { $first: '$requestDate' },
        },
      },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: { year: '$_id.year', month: '$_id.month', day: '$_id.day' },
          success: { $sum: { $cond: [{ $eq: ['$_id.isSuccess', true]  }, '$count', 0] } },
          failed:  { $sum: { $cond: [{ $eq: ['$_id.isSuccess', false] }, '$count', 0] } },
          date:    { $first: '$date' },
        },
      },
      { $sort: { date: 1 } },
      { $project: { _id: 0, date: { $dateToString: { format: '%b %d', date: '$date' } }, success: 1, failed: 1 } },
    ]);

    // ── Endpoint / model usage ────────────────────────────────────────────────
    const modelUsage = await RequestLog.aggregate([
      { $match: { userId: user._id, requestDate: { $gte: cutoffDate, $lte: now } } },
      {
        $group: {
          _id: '$endpointRoute',
          requests:      { $sum: 1 },
          credits:       { $sum: '$creditsUsed' },
          responseTime:  { $avg: '$responseTime' },
          successCount:  { $sum: { $cond: [{ $eq: ['$isSuccess', true]  }, 1, 0] } },
          failureCount:  { $sum: { $cond: [{ $eq: ['$isSuccess', false] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          name: {
            $cond: [
              { $eq: ['$_id', '/api/v1/public/eta'] }, 'Time Estimation',
              { $cond: [{ $eq: ['$_id', '/api/v1/public/distance'] }, 'Distance Estimation', 'Combined Model'] },
            ],
          },
          requests: 1,
          credits:  1,
          avgResponseTime: { $round: ['$responseTime', 0] },
          successRate: {
            $round: [
              {
                $multiply: [
                  {
                    $cond: [
                      { $eq: [{ $add: ['$successCount', '$failureCount'] }, 0] },
                      0,
                      { $divide: ['$successCount', { $add: ['$successCount', '$failureCount'] }] },
                    ],
                  },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
    ]);

    // ── Credits ───────────────────────────────────────────────────────────────
    const totalCredits     = apiSettings.totalCredits;
    const usedCredits      = apiSettings.usedCredits;
    const remainingCredits = totalCredits - usedCredits;

    // Bug fix: preserve fractional precision so small usage values (e.g. 2/7000 = 0.028%)
    // are not truncated to 0 by toFixed(1). Round to 4 decimal places and let the
    // frontend decide how to display it.
    const percentUsed = totalCredits > 0
      ? Math.round((usedCredits / totalCredits) * 100 * 10000) / 10000
      : 0;

    const formattedRefreshDate = refreshDate.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    return rv.send(res, usageView.summary({
      credits: {
        total: totalCredits,
        used: usedCredits,
        remaining: remainingCredits,
        percentUsed,
        refreshDate: formattedRefreshDate,
        history: dailyCreditUsage,
      },
      requests: {
        total: totalRequests,
        successful: successfulRequests,
        failed: failedRequests,
        successRate,
        history: dailyRequestHistory,
      },
      models: modelUsage,
      limits: {
        requestsPerMinute:  apiSettings.requestsPerMinute,
        requestsPerHour:    apiSettings.requestsPerHour,
        requestsPerDay:     apiSettings.requestsPerDay,
        concurrentRequests: apiSettings.concurrentRequests,
      },
    }));
  } catch (error) {
    logger.error(`Error getting usage data: ${error.message}`);
    next(error);
  }
};
