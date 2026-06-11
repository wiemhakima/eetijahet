
const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    currency: 'KWD',
    price: {
      monthly: 9,
      annual: 86,   // ~20% off
    },
    limits: {
      drivers:            2,
      deliveriesPerMonth: 20,
      merchants:          10,
      apiRequests:        0,
      apiAccess:          false,
    },
    features: {
      statistics:       false,
      advancedStats:    false,
      finances:         false,
      advancedFinances: false,
      exportData:       false,
      prioritySupport:  false,
    },
  },

  medium: {
    id: 'medium',
    name: 'Medium',
    currency: 'KWD',
    price: {
      monthly: 25,
      annual: 240,  // ~20% off
    },
    limits: {
      drivers:            10,
      deliveriesPerMonth: -1,  // unlimited
      merchants:          15,
      apiRequests:        0,
      apiAccess:          false,
    },
    features: {
      statistics:       true,
      advancedStats:    false,
      finances:         false,
      advancedFinances: false,
      exportData:       false,
      prioritySupport:  false,
    },
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    currency: 'KWD',
    price: {
      monthly: 49,
      annual: 470,  // ~20% off
    },
    limits: {
      drivers:            -1,  // unlimited
      deliveriesPerMonth: -1,  // unlimited
      merchants:          -1,  // unlimited
      apiRequests:        10000,
      apiAccess:          true,
    },
    features: {
      statistics:       true,
      advancedStats:    true,
      finances:         true,
      advancedFinances: true,
      exportData:       true,
      prioritySupport:  true,
    },
  },
};

/**
 * Returns the plan config for a given plan id.
 * @param {string} planId
 * @returns {Object}
 */
const getPlan = (planId) => {
  const plan = PLANS[planId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);
  return plan;
};

/**
 * Maps plan limits to Agency.settings shape so they can be cached on the agency doc.
 * @param {string} planId
 * @returns {Object}
 */
const planToAgencySettings = (planId) => {
  const { limits } = getPlan(planId);
  return {
    maxDrivers:       limits.drivers,
    maxDeliveries:    limits.deliveriesPerMonth,
    apiAccess:        limits.apiAccess,
    apiRequestsLimit: limits.apiRequests,
  };
};

module.exports = { PLANS, getPlan, planToAgencySettings };
