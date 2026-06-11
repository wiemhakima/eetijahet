/**
 * Logging middleware
 * Logs API requests to the database for tracking and analytics
 */
const RequestLog = require('../../models/RequestLog');
const logger = require('../../utils/logger');
const NodeCache = require('node-cache');

// Create a cache for endpoint mappings
const endpointCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 }); // 1 hour TTL

// Endpoint mapping for human-readable names and categories
const endpointMapping = {
  '/api/v1/public/eta': {
    name: 'ETA Prediction',
    category: 'estimation'
  },
  '/api/v1/public/combined': {
    name: 'Combined Prediction',
    category: 'estimation'
  },
  '/api/v1/public/distance': {
    name: 'Distance Calculation',
    category: 'estimation'
  },
  '/api/v1/auth/login': {
    name: 'User Login',
    category: 'authentication'
  },
  '/api/v1/auth/signup': {
    name: 'User Registration',
    category: 'authentication'
  },
  '/api/v1/auth/me': {
    name: 'Get User Profile',
    category: 'authentication'
  },
  '/api/v1/api-keys': {
    name: 'API Keys Management',
    category: 'management'
  },
  '/api/v1/usage': {
    name: 'Usage Statistics',
    category: 'analytics'
  },
  '/api/v1/logs': {
    name: 'Request Logs',
    category: 'analytics'
  },
  '/api/v1/status': {
    name: 'System Status',
    category: 'system'
  }
};

// Helper function to get endpoint info with caching
const getEndpointInfo = (route) => {
  // Remove query parameters for matching
  const baseRoute = route.split('?')[0];
  
  // Check cache first
  const cacheKey = `endpoint_info_${baseRoute}`;
  const cachedInfo = endpointCache.get(cacheKey);
  if (cachedInfo) {
    return cachedInfo;
  }
  
  // Try exact match first
  if (endpointMapping[baseRoute]) {
    const result = endpointMapping[baseRoute];
    endpointCache.set(cacheKey, result);
    return result;
  }
  
  // Try to match route patterns (for routes with IDs)
  for (const [pattern, info] of Object.entries(endpointMapping)) {
    // Convert exact routes to patterns by replacing IDs with wildcards
    const patternRegex = pattern.replace(/\/:[^/]+/g, '/[^/]+');
    if (new RegExp(`^${patternRegex}$`).test(baseRoute)) {
      endpointCache.set(cacheKey, info);
      return info;
    }
  }
  
  // Default values if no match found
  const defaultInfo = {
    name: 'Unknown Endpoint',
    category: 'other'
  };
  
  endpointCache.set(cacheKey, defaultInfo);
  return defaultInfo;
};

// Create a buffer for batch processing logs
const logBuffer = [];
const MAX_BUFFER_SIZE = 10; // Process logs in batches of 10
const MAX_BUFFER_AGE = 30000; // Or every 30 seconds

// Set up a timer to flush the buffer periodically
let bufferTimer = setInterval(() => {
  flushLogBuffer();
}, MAX_BUFFER_AGE);

// Function to flush the log buffer
const flushLogBuffer = async () => {
  if (logBuffer.length === 0) return;
  
  const logsToProcess = [...logBuffer];
  logBuffer.length = 0; // Clear the buffer
  
  try {
    // Use insertMany for better performance with multiple logs
    await RequestLog.insertMany(logsToProcess);
    logger.info(`Batch processed ${logsToProcess.length} request logs`);
  } catch (error) {
    logger.error(`Error batch processing logs: ${error.message}`);
    // If batch insert fails, try to save logs individually
    for (const log of logsToProcess) {
      try {
        const requestLog = new RequestLog(log);
        await requestLog.save();
      } catch (innerError) {
        logger.error(`Failed to save individual log: ${innerError.message}`);
      }
    }
  }
};

// Optimize message extraction
const extractResponseMessage = (responseBody, statusCode) => {
  // Default message based on status code
  let responseMessage = 'Request processed';
  
  if (statusCode >= 200 && statusCode < 300) {
    responseMessage = 'Request successful';
  } else if (statusCode >= 400) {
    if (statusCode === 400) responseMessage = 'Bad Request';
    else if (statusCode === 401) responseMessage = 'Unauthorized';
    else if (statusCode === 403) responseMessage = 'Forbidden';
    else if (statusCode === 404) responseMessage = 'Not Found';
    else if (statusCode === 429) responseMessage = 'Too Many Requests';
    else if (statusCode >= 500) responseMessage = 'Server Error';
  }
  
  // Try to extract more specific message from response body
  if (responseBody) {
    let parsedBody;
    
    // Parse string response if needed
    if (typeof responseBody === 'string') {
      try {
        parsedBody = JSON.parse(responseBody);
      } catch (e) {
        // Not JSON, use truncated string
        return responseBody.substring(0, 200);
      }
    } else if (typeof responseBody === 'object') {
      parsedBody = responseBody;
    }
    
    // Extract message from parsed body
    if (parsedBody) {
      if (parsedBody.error) return parsedBody.error;
      if (parsedBody.message) return parsedBody.message;
      if (parsedBody.success !== undefined) {
        return parsedBody.success ? 'Operation successful' : 'Operation failed';
      }
      if (parsedBody.data) return 'Data retrieved successfully';
    }
  }
  
  return responseMessage;
};

const loggingMiddleware = async (req, res, next) => {
  // Skip logging for certain endpoints to improve performance
  if (req.originalUrl === '/api/v1/status' || req.originalUrl.startsWith('/api/v1/status?')) {
    return next();
  }
  
  // Record the start time for calculating response time
  const startTime = Date.now();
  
  // Add a flag to track if this request has been logged
  req._isLogged = false;
  
  // Store original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;
  
  // Get the endpoint route without the full server URL
  const endpointRoute = req.originalUrl;
  
  // Get endpoint info
  const { name: endpointName, category: endpointCategory } = getEndpointInfo(endpointRoute);
  
  // Create a function to log the request
  const logRequest = (responseBody, statusCode) => {
    try {
      // Check if this request has already been logged
      if (req._isLogged) {
        return;
      }
      
      // Mark this request as logged
      req._isLogged = true;
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Determine if the request was successful based on status code
      const isSuccess = statusCode >= 200 && statusCode < 400;
      
      // Extract response message
      const responseMessage = extractResponseMessage(responseBody, statusCode);
      
      // Create the log entry object (don't create the model instance yet)
      const logEntry = {
        userId: req.user ? req.user._id : null,
        apiKeyId: req.apiKey ? req.apiKey._id : null,
        apiKey: req.apiKey ? req.apiKey.key : null,
        apiKeyName: req.apiKey ? req.apiKey.name : null,
        requestStatus: statusCode,
        responseMessage: responseMessage,
        requestDate: new Date(),
        creditsUsed: req.apiSettings ? req.apiSettings.costPerRequest : 1,
        endpointRoute: endpointRoute,
        endpointName: endpointName,
        endpointCategory: endpointCategory,
        method: req.method,
        // Only store request body for non-GET requests and limit size
        requestBody: req.method !== 'GET' ? 
          (typeof req.body === 'object' ? 
            JSON.stringify(req.body).substring(0, 1000) : 
            String(req.body).substring(0, 1000)) : 
          null,
        responseTime: responseTime,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        errorDetails: !isSuccess ? responseMessage : null,
        isSuccess: isSuccess
      };
      
      // Add to buffer instead of saving immediately
      logBuffer.push(logEntry);
      
      // If buffer reaches threshold, process it
      if (logBuffer.length >= MAX_BUFFER_SIZE) {
        flushLogBuffer();
      }
      
      // Log basic info to console but don't wait for it
      logger.info(`${req.method} ${endpointRoute} - ${statusCode} - ${responseTime}ms`);
    } catch (error) {
      // Don't let logging errors affect the API response
      logger.error(`Error logging request: ${error.message}`);
    }
  };
  
  // Override response methods to capture the response
  res.send = function(body) {
    logRequest(body, res.statusCode);
    return originalSend.apply(this, arguments);
  };
  
  res.json = function(body) {
    logRequest(body, res.statusCode);
    return originalJson.apply(this, arguments);
  };
  
  res.end = function(chunk, encoding) {
    logRequest(chunk, res.statusCode);
    return originalEnd.apply(this, arguments);
  };
  
  // Continue to the next middleware
  next();
};

// Clean up timer on process exit
process.on('exit', () => {
  clearInterval(bufferTimer);
  flushLogBuffer();
});

module.exports = loggingMiddleware;
