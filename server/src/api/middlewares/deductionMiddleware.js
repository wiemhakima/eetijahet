const User = require('../../models/User');
const UserApiSettings = require('../../models/UserApiSettings');
const logger = require('../../utils/logger');
const NodeCache = require('node-cache');

// Create a cache for user API settings with 5-minute TTL
const userSettingsCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Middleware to handle API usage tracking, rate limiting, and credit deduction
 * This middleware should be used after apiKeyMiddleware which attaches the user to the request
 */
const deductionMiddleware = async (req, res, next) => {
  try {
    // The apiKeyMiddleware should have attached the user to the request
    if (!req.user) {
      return res.status(500).json({ 
        success: false,
        error: 'User not found in request. Make sure apiKeyMiddleware is used before this middleware.' 
      });
    }

    // Create a cache key for this user
    const cacheKey = `user_settings_${req.user._id}`;
    
    // Try to get user settings from cache first
    let user;
    let apiSettings;
    
    const cachedSettings = userSettingsCache.get(cacheKey);
    if (cachedSettings) {
      // Use cached settings
      user = cachedSettings.user;
      apiSettings = cachedSettings.apiSettings;
      logger.debug('Using cached user API settings');
    } else {
      // Get the user from the database to ensure we have the latest data
      user = await User.findById(req.user._id).populate('activeApiSettings');
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Get the user's API settings
      apiSettings = user.activeApiSettings;
      if (!apiSettings) {
        return res.status(404).json({ 
          success: false,
          error: 'API settings not found for this user' 
        });
      }
      
      // Cache the user and API settings
      userSettingsCache.set(cacheKey, { user, apiSettings });
    }

    // Check if user has enough credits
    if (apiSettings.totalCredits - apiSettings.usedCredits < apiSettings.costPerRequest) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient credits. Please add more credits to your account.' 
      });
    }

    // Check rate limits
    const now = new Date();

    // Reset counters if time periods have elapsed
    let needsUpdate = false;
    
    if (now - apiSettings.lastMinuteReset > 60000) { // 1 minute in milliseconds
      apiSettings.currentMinuteRequests = 0;
      apiSettings.lastMinuteReset = now;
      needsUpdate = true;
    }

    if (now - apiSettings.lastHourReset > 3600000) { // 1 hour in milliseconds
      apiSettings.currentHourRequests = 0;
      apiSettings.lastHourReset = now;
      needsUpdate = true;
    }

    if (now - apiSettings.lastDayReset > 86400000) { // 1 day in milliseconds
      apiSettings.currentDayRequests = 0;
      apiSettings.lastDayReset = now;
      needsUpdate = true;
    }

    // Check if rate limits are exceeded
    if (apiSettings.currentMinuteRequests >= apiSettings.requestsPerMinute) {
      return res.status(429).json({ 
        success: false,
        error: 'Rate limit exceeded. Too many requests per minute.' 
      });
    }

    if (apiSettings.currentHourRequests >= apiSettings.requestsPerHour) {
      return res.status(429).json({ 
        success: false,
        error: 'Rate limit exceeded. Too many requests per hour.' 
      });
    }

    if (apiSettings.currentDayRequests >= apiSettings.requestsPerDay) {
      return res.status(429).json({ 
        success: false,
        error: 'Rate limit exceeded. Too many requests per day.' 
      });
    }

    if (apiSettings.currentConcurrentRequests >= apiSettings.concurrentRequests) {
      return res.status(429).json({ 
        success: false,
        error: 'Too many concurrent requests. Please try again later.' 
      });
    }

    // Increment concurrent requests counter
    apiSettings.currentConcurrentRequests += 1;
    
    // Save if needed
    if (needsUpdate) {
      await apiSettings.save();
      // Update the cache
      userSettingsCache.set(cacheKey, { user, apiSettings });
    } else {
      // Use updateOne for better performance when we only need to update one field
      await UserApiSettings.updateOne(
        { _id: apiSettings._id },
        { $inc: { currentConcurrentRequests: 1 } }
      );
    }

    // Add a flag to track if API settings have been updated for this request
    req._apiSettingsUpdated = false;

    // Store the original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    // Function to update API settings after request completes
    const updateApiSettings = async (isSuccess) => {
      try {
        // Check if API settings have already been updated for this request
        if (req._apiSettingsUpdated) {
          return;
        }
        
        // Mark API settings as updated for this request
        req._apiSettingsUpdated = true;
        
        // Use atomic update operations for better performance
        const updateResult = await UserApiSettings.updateOne(
          { _id: apiSettings._id },
          { 
            $inc: { 
              currentConcurrentRequests: -1,
              totalRequests: 1,
              currentMinuteRequests: 1,
              currentHourRequests: 1,
              currentDayRequests: 1,
              successfulRequestsCount: isSuccess ? 1 : 0,
              failedRequestsCount: isSuccess ? 0 : 1,
              usedCredits: apiSettings.costPerRequest
            }
          }
        );
        
        // Invalidate the cache to ensure fresh data on next request
        userSettingsCache.del(cacheKey);
        
        logger.info(`API request processed for user ${user._id}. Success: ${isSuccess}, Remaining credits: ${apiSettings.totalCredits - apiSettings.usedCredits - apiSettings.costPerRequest}`);
      } catch (error) {
        logger.error(`Error updating API settings: ${error.message}`);
      }
    };

    // Override response methods to track when the request completes
    res.send = function(body) {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
      updateApiSettings(isSuccess);
      return originalSend.apply(this, arguments);
    };

    res.json = function(body) {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
      updateApiSettings(isSuccess);
      return originalJson.apply(this, arguments);
    };

    res.end = function(chunk, encoding) {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
      updateApiSettings(isSuccess);
      return originalEnd.apply(this, arguments);
    };

    // Attach the API settings to the request for potential use in later middleware or controllers
    req.apiSettings = apiSettings;

    next();
  } catch (error) {
    logger.error(`Error in deduction middleware: ${error.message}`);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error during request processing' 
    });
  }
};

module.exports = deductionMiddleware;
