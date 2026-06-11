/**
 * Subscription controller — plan management and billing for agencies.
 */
const Subscription = require('../../models/Subscription');
const Agency = require('../../models/Agency');
const Notification = require('../../models/Notification');
const { PLANS, getPlan, planToAgencySettings } = require('../../config/plans');
const logger = require('../../utils/logger');
const rv = require('../../views/responseView');
const subscriptionView = require('../../views/subscriptionView');

// ── Plans catalog ─────────────────────────────────────────────────────────────

/**
 * @desc  List all available subscription plans
 * @route GET /api/v1/subscriptions/plans
 * @access Public
 */
exports.listPlans = (req, res) => {
  return rv.send(res, subscriptionView.plans(Object.values(PLANS)));
};

// ── Current subscription ──────────────────────────────────────────────────────

/**
 * @desc  Get the active subscription for the current agency
 * @route GET /api/v1/subscriptions/current
 * @access Private (agency_admin)
 */
exports.getCurrentSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ agency: req.agency._id });

    if (!subscription) {
      return rv.send(res, subscriptionView.notFound('No subscription found.'));
    }

    const plan = getPlan(subscription.plan);
    return rv.send(res, rv.success({ data: { subscription, plan } }));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Subscribe (or upgrade) the agency to a plan
 * @route POST /api/v1/subscriptions
 * @access Private (agency_admin)
 */
exports.subscribe = async (req, res, next) => {
  try {
    const { plan, billing = 'monthly' } = req.body;

    try { getPlan(plan); } catch {
      return rv.send(res, subscriptionView.badRequest(`Invalid plan: ${plan}.`));
    }

    if (!['monthly', 'annual'].includes(billing)) {
      return rv.send(res, subscriptionView.badRequest('billing must be monthly or annual.'));
    }

    const periodEnd = billing === 'annual'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30  * 24 * 60 * 60 * 1000);

    // Upsert: update existing subscription or create new one
    const subscription = await Subscription.findOneAndUpdate(
      { agency: req.agency._id },
      {
        plan,
        billing,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Update cached settings on agency
    await Agency.findByIdAndUpdate(req.agency._id, {
      status: 'active',
      subscription: subscription._id,
      settings: planToAgencySettings(plan),
    });

    const planConfig = getPlan(plan);
    await Notification.create({
      title: 'Subscription updated',
      message: `Your agency is now on the ${planConfig.name} plan (${billing} billing).`,
      type: 'success',
      user: req.user._id,
    });

    logger.info(`Agency ${req.agency.name} subscribed to ${plan} (${billing})`);
    return rv.send(res, subscriptionView.saved(subscription));
  } catch (error) {
    logger.error(`Subscribe error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc  Change plan or billing cycle for the current subscription
 * @route PUT /api/v1/subscriptions/current
 * @access Private (agency_admin)
 */
exports.updateSubscription = async (req, res, next) => {
  try {
    const { plan, billing } = req.body;
    const subscription = await Subscription.findOne({ agency: req.agency._id });

    if (!subscription) {
      return rv.send(res, subscriptionView.notFound('No subscription found.'));
    }

    if (plan) {
      try { getPlan(plan); } catch {
        return rv.send(res, subscriptionView.badRequest(`Invalid plan: ${plan}.`));
      }
      subscription.plan = plan;

      // Sync cached limits on agency
      await Agency.findByIdAndUpdate(req.agency._id, { settings: planToAgencySettings(plan) });
    }

    if (billing && ['monthly', 'annual'].includes(billing)) {
      subscription.billing = billing;
    }

    await subscription.save();
    logger.info(`Agency ${req.agency.name} subscription updated: plan=${subscription.plan}, billing=${subscription.billing}`);
    return rv.send(res, subscriptionView.saved(subscription));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Cancel subscription at end of current period
 * @route DELETE /api/v1/subscriptions/current
 * @access Private (agency_admin)
 */
exports.cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ agency: req.agency._id });

    if (!subscription) {
      return rv.send(res, subscriptionView.notFound('No subscription found.'));
    }

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    await Notification.create({
      title: 'Subscription cancellation scheduled',
      message: `Your subscription will remain active until ${subscription.currentPeriodEnd.toDateString()} and will not renew.`,
      type: 'warning',
      user: req.user._id,
    });

    logger.info(`Agency ${req.agency.name} scheduled subscription cancellation`);
    return rv.send(res, subscriptionView.cancelled(subscription));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get invoice history for the current agency
 * @route GET /api/v1/subscriptions/invoices
 * @access Private (agency_admin)
 */
exports.getInvoices = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ agency: req.agency._id }).select('invoices plan billing');

    if (!subscription) {
      return rv.send(res, subscriptionView.notFound('No subscription found.'));
    }

    return rv.send(res, rv.success({ data: subscription.invoices }));
  } catch (error) {
    next(error);
  }
};

// ── Super-admin metrics ───────────────────────────────────────────────────────

/**
 * @desc  Platform-wide metrics (MRR, active agencies, plan breakdown)
 * @route GET /api/v1/super-admin/metrics
 * @access Private (admin)
 */
exports.getPlatformMetrics = async (req, res, next) => {
  try {
    const { PLANS: planDefs } = require('../../config/plans');

    const [activeSubscriptions, trialAgencies, suspendedAgencies] = await Promise.all([
      Subscription.find({ status: 'active' }),
      Agency.countDocuments({ status: 'trial' }),
      Agency.countDocuments({ status: 'suspended' }),
    ]);

    // Monthly Recurring Revenue — sum monthly-equivalent prices
    let mrr = 0;
    const planBreakdown = { basic: 0, medium: 0, pro: 0 };

    for (const sub of activeSubscriptions) {
      if (!planDefs[sub.plan]) continue;
      planBreakdown[sub.plan]++;
      const monthlyPrice = sub.billing === 'annual'
        ? Math.round(planDefs[sub.plan].price.annual / 12)
        : planDefs[sub.plan].price.monthly;
      mrr += monthlyPrice;
    }

    return rv.send(res, rv.success({
      data: {
        mrr,
        arr: mrr * 12,
        activeAgencies: activeSubscriptions.length,
        trialAgencies,
        suspendedAgencies,
        planBreakdown,
      },
    }));
  } catch (error) {
    next(error);
  }
};
