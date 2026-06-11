/**
 * Model Server Service
 * Calls the externally-managed Flask model server (Core/app.py) on port 8050.
 * Node.js does NOT spawn or manage the Python process — start it manually.
 */
const axios = require('axios');
const logger = require('../utils/logger');

const FLASK_HOST = process.env.MODEL_SERVER_CLIENT_HOST || '127.0.0.1';
const FLASK_PORT = parseInt(process.env.MODEL_SERVER_PORT || '8050', 10);
const FLASK_BASE = `http://${FLASK_HOST}:${FLASK_PORT}`;

// GCC timezone days indexed by UTC day (Sunday=0)
const GCC_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Check if the Flask model server is reachable.
 * @returns {Promise<boolean>}
 */
const checkHealth = async () => {
  try {
    const response = await axios.get(`${FLASK_BASE}/health`, { timeout: 2000 });
    return response.status === 200 && response.data.status === 'ok';
  } catch (error) {
    logger.error(`Flask health check failed: ${error.message}`);
    return false;
  }
};

/**
 * Make a prediction via the Flask model server.
 * @param {Object} data
 * @param {number} data.pickup_lat
 * @param {number} data.pickup_lon
 * @param {number} data.drop_lat
 * @param {number} data.drop_lon
 * @param {string} data.pickup_time_utc  ISO-8601 UTC string
 * @returns {Promise<Object>}
 */
const predict = async (data) => {
  const { pickup_lat, pickup_lon, drop_lat, drop_lon, pickup_time_utc } = data;

  const response = await axios.post(
    `${FLASK_BASE}/predict_route`,
    {
      start: [parseFloat(pickup_lat), parseFloat(pickup_lon)],
      end:   [parseFloat(drop_lat),   parseFloat(drop_lon)]
    },
    {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    }
  );

  const { distance, eta } = response.data;

  // Compute Kuwait/GCC time context (UTC+3) from pickup_time_utc
  const pickupUtc  = new Date(pickup_time_utc);
  const gccMs      = pickupUtc.getTime() + 3 * 60 * 60 * 1000;
  const gccDate    = new Date(gccMs);
  const dayOfWeek  = GCC_DAYS[gccDate.getUTCDay()];
  const hourOfDay  = gccDate.getUTCHours();
  const localIso   = gccDate.toISOString().replace('Z', '+03:00');

  return {
    distance_meters:         distance,
    estimated_eta_minutes:   eta,
    pickup_local_time:       localIso,
    day_of_week:             dayOfWeek,
    hour_of_day:             hourOfDay,
    _meta: { prediction_time_ms: null }
  };
};

module.exports = { checkHealth, predict };
