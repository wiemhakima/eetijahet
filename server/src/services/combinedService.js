/**
 * Combined Prediction Service
 * Provides distance and ETA predictions using the combined model
 */
const logger = require('../utils/logger');
const NodeCache = require('node-cache');
const modelServerService = require('./modelServerService');
const { performance } = require('perf_hooks');

// Create a cache with TTL of 10 minutes and check period of 60 seconds
const predictionCache = new NodeCache({ stdTTL: 600, checkperiod: 60 });

/**
 * Get combined distance and ETA prediction from model
 * @param {Object} data - Input data for prediction
 * @param {number} data.pickup_lat - Pickup latitude
 * @param {number} data.pickup_lon - Pickup longitude
 * @param {number} data.drop_lat - Drop-off latitude
 * @param {number} data.drop_lon - Drop-off longitude
 * @param {string} data.pickup_time_utc - Pickup time in UTC (ISO 8601 format)
 * @returns {Promise<Object>} - Combined prediction result with distance and ETA
 */
const predictCombined = async (data) => {
  const startTime = performance.now();
  
  try {
    // Validate input data
    const { pickup_lat, pickup_lon, drop_lat, drop_lon, pickup_time_utc } = data;
    
    // Check if we have the required location parameters
    if (
      pickup_lat === undefined || pickup_lon === undefined ||
      drop_lat === undefined || drop_lon === undefined
    ) {
      throw new Error('Missing required location parameters for combined prediction');
    }
    
    // Check if pickup_time_utc is provided
    if (!pickup_time_utc) {
      throw new Error('Missing pickup_time_utc parameter for combined prediction');
    }

    // Create a cache key based on input parameters
    // Round coordinates to 5 decimal places to increase cache hits for nearby locations
    const cacheKey = `${parseFloat(pickup_lat).toFixed(5)}_${parseFloat(pickup_lon).toFixed(5)}_${parseFloat(drop_lat).toFixed(5)}_${parseFloat(drop_lon).toFixed(5)}_${pickup_time_utc}`;
    
    // Check if we have a cached result
    const cachedResult = predictionCache.get(cacheKey);
    if (cachedResult) {
      logger.debug('Using cached prediction result');
      const endTime = performance.now();
      logger.info(`Combined prediction (cached) completed in ${(endTime - startTime).toFixed(2)}ms`);
      return cachedResult;
    }

    // Use the model server for prediction
    logger.debug('Making prediction request to model server');
    
    // Make the prediction request
    const predictionResult = await modelServerService.predict({
      pickup_lat,
      pickup_lon,
      drop_lat,
      drop_lon,
      pickup_time_utc
    });
    
    // Format the response
    const formattedResponse = {
      distance_meters: predictionResult.distance_meters,
      eta_minutes: predictionResult.estimated_eta_minutes,
      request: {
        pickup: {
          lat: pickup_lat,
          lon: pickup_lon
        },
        dropoff: {
          lat: drop_lat,
          lon: drop_lon
        },
        time: {
          pickup_time_utc: pickup_time_utc,
          pickup_local_time: predictionResult.pickup_local_time,
          day_of_week: predictionResult.day_of_week,
          hour_of_day: predictionResult.hour_of_day
        }
      },
      timestamp: new Date().toISOString(),
      _meta: {
        prediction_time_ms: predictionResult._meta?.prediction_time_ms,
        service_time_ms: (performance.now() - startTime).toFixed(2)
      }
    };
    
    // Cache the result
    predictionCache.set(cacheKey, formattedResponse);
    
    const endTime = performance.now();
    logger.info(`Combined prediction completed in ${(endTime - startTime).toFixed(2)}ms (model server: ${predictionResult._meta?.prediction_time_ms || 'unknown'}ms)`);
    
    return formattedResponse;
  } catch (error) {
    const endTime = performance.now();
    logger.error(`Combined prediction error after ${(endTime - startTime).toFixed(2)}ms: ${error.message}`);
    throw error;
  }
};

module.exports = {
  predictCombined
};
