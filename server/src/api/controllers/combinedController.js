/**
 * Combined Model Controller
 * Handles requests for combined distance and ETA predictions
 */
const combinedService = require('../../services/combinedService');
const logger = require('../../utils/logger');
const { performance } = require('perf_hooks');
const rv = require('../../views/responseView');
const routingView = require('../../views/routingView');

/**
 * @desc    Predict combined distance and ETA
 * @route   POST /api/v1/public/combined
 * @access  Public (with API key)
 */
const predictCombined = async (req, res, next) => {
  const startTime = performance.now();

  try {
    logger.info('Combined prediction request received');

    // Validate required fields early to avoid unnecessary processing
    const { pickup_lat, pickup_lon, drop_lat, drop_lon, pickup_time_utc } = req.body;

    if (!pickup_lat || !pickup_lon || !drop_lat || !drop_lon || !pickup_time_utc) {
      return rv.send(res, rv.badRequest('Missing required parameters for prediction'));
    }

    // Process the request
    const result = await combinedService.predictCombined(req.body);

    // Calculate response time
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    // Log performance metrics
    logger.info(`Combined prediction successful - Response time: ${responseTime.toFixed(2)}ms`);

    return rv.send(res, rv.success(result));
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    logger.error(`Combined prediction controller error: ${error.message} - Response time: ${responseTime.toFixed(2)}ms`);
    next(error);
  }
};

module.exports = {
  predictCombined
};
