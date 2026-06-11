/**
 * Subscription limit middleware — enforces plan-based caps on deliveries, drivers,
 * merchants, and feature access before reaching the relevant route handler.
 */
const User     = require('../../models/User');
const Merchant = require('../../models/Merchant');

const LIMITS = {
  basic:  { maxDeliveries: 20,  maxMerchants: 10 },
  medium: { maxDeliveries: -1,  maxMerchants: 15 },
  pro:    { maxDeliveries: -1,  maxMerchants: -1 },
};

const FEATURES = {
  basic:  { statistics: false, finances: false },
  medium: { statistics: true,  finances: false },
  pro:    { statistics: true,  finances: true  },
};

/**
 * Resets the monthly delivery counter if the current month differs from lastResetDate.
 */
async function resetMonthlyUsageIfNeeded(agency) {
  const now      = new Date();
  const lastReset = new Date(agency.usage?.lastResetDate || 0);
  if (
    now.getMonth()     !== lastReset.getMonth() ||
    now.getFullYear()  !== lastReset.getFullYear()
  ) {
    agency.usage = { deliveriesThisMonth: 0, lastResetDate: now };
    await agency.save();
  }
}

// ── Delivery limit ────────────────────────────────────────────────────────────

exports.checkDeliveryLimit = async (req, res, next) => {
  try {
    const agency = req.agency;
    const plan   = agency.subscription?.plan || 'basic';
    const limits = LIMITS[plan] || LIMITS.basic;

    await resetMonthlyUsageIfNeeded(agency);

    if (limits.maxDeliveries !== -1 && agency.usage.deliveriesThisMonth >= limits.maxDeliveries) {
      return res.status(403).json({
        error:        'Delivery limit reached',
        message:      `Your ${plan} plan allows ${limits.maxDeliveries} deliveries/month. Upgrade to continue.`,
        currentUsage: agency.usage.deliveriesThisMonth,
        limit:        limits.maxDeliveries,
        upgradeUrl:   '/agency/subscription',
      });
    }

    req.subscriptionLimits = limits;
    next();
  } catch (err) {
    next(err);
  }
};

// ── Merchant limit ────────────────────────────────────────────────────────────

exports.checkMerchantLimit = async (req, res, next) => {
  try {
    const agency   = req.agency;
    const plan     = agency.subscription?.plan || 'basic';
    const limits   = LIMITS[plan] || LIMITS.basic;

    if (limits.maxMerchants !== -1) {
      const currentMerchants = await Merchant.countDocuments({ agency: req.agency._id });
      if (currentMerchants >= limits.maxMerchants) {
        return res.status(403).json({
          error:        'Merchant limit reached',
          message:      `Your ${plan} plan allows ${limits.maxMerchants} merchants. Upgrade to add more.`,
          currentCount: currentMerchants,
          limit:        limits.maxMerchants,
          upgradeUrl:   '/agency/subscription',
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

// ── Feature access ────────────────────────────────────────────────────────────

exports.checkFeature = (feature) => async (req, res, next) => {
  try {
    // Gestionnaires always have full access to statistics and finances
    if (req.user.role === 'gestionnaire_agency') return next();

    const agency   = req.agency;
    const plan     = agency.subscription?.plan || 'basic';
    const features = FEATURES[plan] || FEATURES.basic;

    if (!features[feature]) {
      return res.status(403).json({
        error:        'Feature not available',
        message:      `"${feature}" is not available on your ${plan} plan. Upgrade to access it.`,
        requiredPlan: feature === 'finances' ? 'pro' : 'medium',
        upgradeUrl:   '/agency/subscription',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};
