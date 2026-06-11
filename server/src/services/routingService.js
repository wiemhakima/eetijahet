/**
 * Routing Service
 * Handles route optimization requests
 */
const { execFile } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');

// Create cache with 10 minute TTL
const routeCache = new NodeCache({ stdTTL: 600, checkperiod: 60 });

/**
 * Optimize route using Python ML service
 */
const optimizeRoute = async (data) => {
  try {
    const { pickup, dropoff, pickup_time_utc } = data;
    
    // Validate input
    if (!pickup || !dropoff || !pickup_time_utc) {
      throw new Error('Missing required parameters');
    }
    
    if (!pickup.lat || !pickup.lon || !dropoff.lat || !dropoff.lon) {
      throw new Error('Invalid coordinates provided');
    }
    
    // Check cache
    const cacheKey = `${pickup.lat}_${pickup.lon}_${dropoff.lat}_${dropoff.lon}_${pickup_time_utc}`;
    const cachedResult = routeCache.get(cacheKey);
    
    if (cachedResult) {
      logger.debug('Returning cached route');
      return cachedResult;
    }
    
    // Call Python script
    const scriptPath = path.join(__dirname, '../../../Core/route_optimizer.py');
    const pythonPath = process.env.PYTHON_PATH || 'python';
    
    logger.debug(`Calling Python script: ${scriptPath}`);
    
    const result = await new Promise((resolve, reject) => {
      execFile(
        pythonPath,
        [
          scriptPath,
          pickup.lat.toString(),
          pickup.lon.toString(),
          dropoff.lat.toString(),
          dropoff.lon.toString(),
          pickup_time_utc
        ],
        { timeout: 30000 },
        (err, stdout, stderr) => {
          if (err) {
            logger.error('Route optimization error:', err);
            logger.error('Python stderr:', stderr);
            return reject(err);
          }
          
          if (stderr) {
            logger.warn('Python stderr (non-fatal):', stderr);
          }
          
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseErr) {
            logger.error('Failed to parse Python output:', stdout);
            reject(new Error('Failed to parse route result'));
          }
        }
      );
    });
    
    // Cache result
    routeCache.set(cacheKey, result);
    
    logger.info('Route optimization completed successfully');
    return result;
  } catch (error) {
    logger.error('Routing service error:', error);
    throw error;
  }
};

module.exports = {
  optimizeRoute
};
