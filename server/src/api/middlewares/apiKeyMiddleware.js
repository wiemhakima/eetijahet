/**
 * API Key middleware
 */
const ApiKey = require('../../models/ApiKey');
const User = require('../../models/User');
const logger = require('../../utils/logger');
const NodeCache = require('node-cache');

// Create a cache for API keys with 10-minute TTL
const apiKeyCache = new NodeCache({ stdTTL: 600, checkperiod: 60 });

/**
 * Middleware to authenticate requests using API key 
 
 * Verifies the API key from the X-API-Key header
 */
exports.authenticateApiKey = async (req, res, next) => {
  try {
    // Check if API key is provided in header
    const apiKeyString = req.header('X-API-Key');
    
    if (!apiKeyString) {
      return res.status(401).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    // Create a cache key
    const cacheKey = `api_key_${apiKeyString}`;
    
    // Try to get from cache first
    let key;
    let user;
    const cachedData = apiKeyCache.get(cacheKey);
    
    if (cachedData) {
      // Use cached data
      key = cachedData.key;
      user = cachedData.user;
      logger.debug('Using cached API key data');
    } else {
      // Find the API key in the database
      key = await ApiKey.findOne({ key: apiKeyString });
      
      if (!key) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key'
        });
      }
      
      // Check if the API key is active 
      if (key.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: `API key is ${key.status}`
        });
      }
      
      // Check if the API key is expired
      if (key.isExpired()) {
        key.status = 'expired';
        await key.save();
        
        // Remove from cache if expired
        apiKeyCache.del(cacheKey);
        
        return res.status(401).json({
          success: false,
          error: 'API key has expired'
        });
      }
      
      // Find the user associated with the API key and populate the activeApiSettings
      user = await User.findById(key.userId).populate('activeApiSettings');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Check if user has active API settings
      if (!user.activeApiSettings) {
        return res.status(401).json({
          success: false,
          error: 'User does not have active API settings'
        });
      }
      
      // Cache the key and user data
      apiKeyCache.set(cacheKey, { key, user });
    }
    
    // Update last used timestamp - use updateOne for better performance
    // Only update if it's been more than 5 minutes since last update to reduce DB writes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (!key.lastUsed || key.lastUsed < fiveMinutesAgo) {
      await ApiKey.updateOne(
        { _id: key._id },
        { $set: { lastUsed: new Date() } }
      );
      
      // Update the cached key
      key.lastUsed = new Date();
      apiKeyCache.set(cacheKey, { key, user });
    }
    
    // Add user and API key to request object
    req.user = user;
    req.apiKey = key;
    
    next();
  } catch (error) {
    logger.error(`API key authentication error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Server error during API key authentication'
    });
  }
};

/**
 * Middleware to check if the API key has the required permission
 * @param {String} permission - The permission to check for
 */
exports.requirePermission = (permission) => {
  return (req, res, next) => {
    // Check if request was authenticated with API key
    if (!req.apiKey) {
      return res.status(403).json({
        success: false,
        error: 'API key authentication required for this endpoint'
      });
    }
    
    // Check if API key has the required permission
    if (!req.apiKey.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `API key does not have the required permission: ${permission}`
      });
    }
    
    next();
  };
};
