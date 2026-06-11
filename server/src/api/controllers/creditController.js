/**
 * Credit Controller
 * Handles HTTP requests for credit management endpoints
 */
const creditService = require('../../services/creditService');
const logger = require('../../utils/logger');
const rv = require('../../views/responseView');
const creditView = require('../../views/creditView');

/**
 * Middleware: restrict credit endpoints to Developer role only.
 */
exports.requireDeveloper = (req, res, next) => {
  if (req.user?.role !== 'developer') {
    return rv.send(res, rv.badRequest('Access denied. API credits are reserved for Developer accounts.'));
  }
  next();
};

/**
 * @desc    Get complete credits overview for the authenticated user
 * @route   GET /api/v1/credits
 * @access  Private (Developer only)
 */
exports.getCreditsOverview = async (req, res, next) => {
  try {
    const data = await creditService.getCreditsOverview(req.user._id);

    return rv.send(res, creditView.balance(data));
  } catch (error) {
    logger.error(`Error getting credits overview: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get available credit packages
 * @route   GET /api/v1/credits/packages
 * @access  Private
 */
exports.getPackages = async (req, res, next) => {
  try {
    const packages = creditService.getPackages();

    return rv.send(res, rv.success({ data: packages }));
  } catch (error) {
    logger.error(`Error getting credit packages: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Purchase a credit package
 * @route   POST /api/v1/credits/purchase
 * @access  Private
 */
exports.purchaseCredits = async (req, res, next) => {
  try {
    const { packageId } = req.body;

    if (!packageId) {
      return rv.send(res, creditView.badRequest('Package ID is required'));
    }

    const result = await creditService.purchaseCredits(req.user._id, packageId);

    return rv.send(res, rv.success({ data: result }));
  } catch (error) {
    logger.error(`Error purchasing credits: ${error.message}`);

    if (error.message === 'Invalid package ID') {
      return rv.send(res, creditView.badRequest(error.message));
    }

    if (error.message === 'User not found' || error.message === 'API settings not found for this user') {
      return rv.send(res, creditView.notFound(error.message));
    }

    next(error);
  }
};

/**
 * @desc    Get paginated transaction history
 * @route   GET /api/v1/credits/transactions
 * @access  Private
 * @query   page (default: 1), limit (default: 20), type (optional: purchase|deduction|bonus|refund)
 */
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type = null,
    } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      type: type || null,
    };

    // Validate pagination params
    if (options.page < 1) options.page = 1;
    if (options.limit < 1 || options.limit > 100) options.limit = 20;

    // Validate type if provided
    const validTypes = ['purchase', 'deduction', 'bonus', 'refund'];
    if (options.type && !validTypes.includes(options.type)) {
      return rv.send(res, creditView.badRequest(`Invalid transaction type. Must be one of: ${validTypes.join(', ')}`));
    }

    const result = await creditService.getTransactions(req.user._id, options);

    return rv.send(res, rv.success({ data: result }));
  } catch (error) {
    logger.error(`Error getting transactions: ${error.message}`);
    next(error);
  }
};
