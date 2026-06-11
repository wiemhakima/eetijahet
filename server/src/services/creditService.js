/**
 * Credit Service
 * Business logic for credit management, packages, transactions, and usage tracking
 */
const User = require('../models/User');
const UserApiSettings = require('../models/UserApiSettings');
const CreditTransaction = require('../models/CreditTransaction');
const RequestLog = require('../models/RequestLog');
const logger = require('../utils/logger');

/**
 * Available credit packages for purchase
 */
const CREDIT_PACKAGES = [
  {
    id: 'pkg_starter',
    name: 'Starter',
    credits: 1000,
    price: 9.99,
    pricePerCredit: 0.00999,
    popular: false,
    savings: '',
  },
  {
    id: 'pkg_growth',
    name: 'Growth',
    credits: 5000,
    price: 39.99,
    pricePerCredit: 0.008,
    popular: true,
    savings: '20% off',
  },
  {
    id: 'pkg_pro',
    name: 'Professional',
    credits: 25000,
    price: 149.99,
    pricePerCredit: 0.006,
    popular: false,
    savings: '40% off',
  },
  {
    id: 'pkg_enterprise',
    name: 'Enterprise',
    credits: 100000,
    price: 449.99,
    pricePerCredit: 0.0045,
    popular: false,
    savings: '55% off',
  },
];

/**
 * Default credit alert settings
 */
const DEFAULT_ALERTS = [
  {
    id: 'alert_low',
    title: 'Low credit warning',
    description: 'Get notified when credits fall below threshold',
    enabled: true,
    threshold: 500,
  },
  {
    id: 'alert_empty',
    title: 'Credits depleted alert',
    description: 'Get notified immediately when credits run out',
    enabled: true,
  },
  {
    id: 'alert_purchase',
    title: 'Auto-purchase on low balance',
    description: 'Automatically buy credits when balance is low',
    enabled: false,
  },
];

/**
 * Service endpoint configurations with their credit costs
 */
const SERVICE_ENDPOINTS = [
  {
    name: 'ETA Prediction',
    endpoint: '/v1/predict/eta',
    endpointRoute: '/api/v1/public/eta',
    creditsPerRequest: 1,
    color: '#1a73e8',
  },
  {
    name: 'Distance Estimation',
    endpoint: '/v1/predict/distance',
    endpointRoute: '/api/v1/public/distance',
    creditsPerRequest: 1,
    color: '#4285f4',
  },
  {
    name: 'Combined Model',
    endpoint: '/v1/predict/combined',
    endpointRoute: '/api/v1/public/combined',
    creditsPerRequest: 2,
    color: '#34a853',
  },
  {
    name: 'Routing Engine',
    endpoint: '/v1/route',
    endpointRoute: '/api/v1/public/route',
    creditsPerRequest: 2,
    color: '#ea4335',
  },
];

/**
 * Get complete credits overview for a user
 * Returns data matching the CreditsData interface expected by the frontend
 */
exports.getCreditsOverview = async (userId) => {
  // Get user with API settings
  const user = await User.findById(userId).populate('activeApiSettings');
  if (!user) {
    throw new Error('User not found');
  }

  const apiSettings = user.activeApiSettings;
  if (!apiSettings) {
    throw new Error('API settings not found for this user');
  }

  const totalCredits = apiSettings.totalCredits;
  const usedCredits = apiSettings.usedCredits;
  const remainingCredits = totalCredits - usedCredits;
  const costPerRequest = apiSettings.costPerRequest;
  const percentUsed = totalCredits > 0
    ? parseFloat(((usedCredits / totalCredits) * 100).toFixed(1))
    : 0;

  // Get service usage breakdown from request logs (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const services = await getServiceUsageBreakdown(userId, thirtyDaysAgo);

  // Get transaction history (last 20 transactions)
  const transactions = await getTransactionHistory(userId, 20);

  // Get daily usage history (last 10 days)
  const usageHistory = await getDailyUsageHistory(userId, 10);

  return {
    totalCredits,
    usedCredits,
    remainingCredits,
    costPerRequest,
    percentUsed,
    packages: CREDIT_PACKAGES,
    services,
    transactions,
    alerts: DEFAULT_ALERTS,
    usageHistory,
  };
};

/**
 * Get service-level credit usage breakdown
 */
async function getServiceUsageBreakdown(userId, since) {
  const serviceUsageAgg = await RequestLog.aggregate([
    {
      $match: {
        userId: userId,
        requestDate: { $gte: since },
      },
    },
    {
      $group: {
        _id: '$endpointRoute',
        totalRequests: { $sum: 1 },
        totalCreditsUsed: { $sum: '$creditsUsed' },
      },
    },
  ]);

  // Map aggregation results to our service definitions
  const services = SERVICE_ENDPOINTS.map((svc) => {
    const match = serviceUsageAgg.find((agg) => {
      // Match by endpoint route or partial match
      return agg._id === svc.endpointRoute ||
        (agg._id && agg._id.includes(svc.endpointRoute));
    });

    return {
      name: svc.name,
      endpoint: svc.endpoint,
      creditsPerRequest: svc.creditsPerRequest,
      totalRequests: match ? match.totalRequests : 0,
      totalCreditsUsed: match ? match.totalCreditsUsed : 0,
      color: svc.color,
    };
  });

  return services;
}

/**
 * Get transaction history for a user
 */
async function getTransactionHistory(userId, limit = 20) {
  const transactions = await CreditTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return transactions.map((txn) => ({
    id: txn._id.toString(),
    type: txn.type,
    description: txn.description,
    credits: txn.credits,
    date: new Date(txn.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    balance: txn.balance,
  }));
}

/**
 * Get daily usage history
 */
async function getDailyUsageHistory(userId, days = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const dailyUsage = await RequestLog.aggregate([
    {
      $match: {
        userId: userId,
        requestDate: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$requestDate' },
          month: { $month: '$requestDate' },
          day: { $dayOfMonth: '$requestDate' },
        },
        credits: { $sum: '$creditsUsed' },
        date: { $first: '$requestDate' },
      },
    },
    {
      $sort: { date: 1 },
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateToString: { format: '%b %d', date: '$date' },
        },
        credits: '$credits',
      },
    },
  ]);

  // Fill in missing days with zero usage
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const found = dailyUsage.find((entry) => entry.date === dateStr);
    result.push({
      date: dateStr,
      credits: found ? found.credits : 0,
    });
  }

  return result;
}

/**
 * Get available credit packages
 */
exports.getPackages = () => {
  return CREDIT_PACKAGES;
};

/**
 * Purchase a credit package
 */
exports.purchaseCredits = async (userId, packageId) => {
  // Find the package
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    throw new Error('Invalid package ID');
  }

  // Get user with API settings
  const user = await User.findById(userId).populate('activeApiSettings');
  if (!user) {
    throw new Error('User not found');
  }

  const apiSettings = user.activeApiSettings;
  if (!apiSettings) {
    throw new Error('API settings not found for this user');
  }

  // Add credits to user's balance
  const previousBalance = apiSettings.totalCredits - apiSettings.usedCredits;
  const newTotalCredits = apiSettings.totalCredits + pkg.credits;
  const newBalance = newTotalCredits - apiSettings.usedCredits;

  // Update UserApiSettings
  await UserApiSettings.updateOne(
    { _id: apiSettings._id },
    { $inc: { totalCredits: pkg.credits } }
  );

  // Create a credit transaction record
  const transaction = await CreditTransaction.create({
    userId,
    type: 'purchase',
    credits: pkg.credits,
    balance: newBalance,
    description: `${pkg.name} Package — ${pkg.credits.toLocaleString()} credits`,
    packageId: pkg.id,
    packageName: pkg.name,
    amountPaid: pkg.price,
  });

  logger.info(`User ${userId} purchased ${pkg.name} package (${pkg.credits} credits) for $${pkg.price}`);

  return {
    transaction: {
      id: transaction._id.toString(),
      type: transaction.type,
      description: transaction.description,
      credits: transaction.credits,
      date: new Date(transaction.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      balance: transaction.balance,
    },
    newBalance,
    totalCredits: newTotalCredits,
    usedCredits: apiSettings.usedCredits,
    remainingCredits: newBalance,
  };
};

/**
 * Get paginated transaction history
 */
exports.getTransactions = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    type = null,
  } = options;

  const query = { userId };
  if (type) {
    query.type = type;
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    CreditTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CreditTransaction.countDocuments(query),
  ]);

  const formattedTransactions = transactions.map((txn) => ({
    id: txn._id.toString(),
    type: txn.type,
    description: txn.description,
    credits: txn.credits,
    date: new Date(txn.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    balance: txn.balance,
    packageName: txn.packageName || null,
    amountPaid: txn.amountPaid || null,
    requestCount: txn.requestCount || null,
  }));

  return {
    transactions: formattedTransactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
