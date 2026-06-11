/**
 * Routing Routes
 */
const express = require('express');
const { optimizeRoute, predictRoute, getRoads, getGraphStatus, getGraphNodes, getGraphEdges } = require('../controllers/routingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authenticateApiKey, requirePermission } = require('../middlewares/apiKeyMiddleware');
const loggingMiddleware = require('../middlewares/loggingMiddleware');

const router = express.Router();

/**
 * @route   POST /api/v1/routing/optimize
 * @desc    Optimize delivery route
 * @access  Private (JWT)
 */
router.post('/optimize', authMiddleware.protect, optimizeRoute);

/**
 * @route   POST /api/v1/routing/predict_route
 * @desc    Proxy to Flask AI routing server — returns path, distance, eta
 * @access  Public (API Key + route_prediction permission)
 */
router.post(
  '/predict_route',
  authenticateApiKey,
  loggingMiddleware,
  requirePermission('route_prediction'),
  predictRoute
);

/**
 * @route   GET /api/v1/routing/roads
 * @desc    GeoJSON road data for map rendering
 * @access  Public (API Key + route_prediction permission)
 */
router.get(
  '/roads',
  authenticateApiKey,
  loggingMiddleware,
  requirePermission('route_prediction'),
  getRoads
);

/**
 * @route   GET /api/v1/routing/graph_status
 * @desc    Graph build status and node/edge counts
 * @access  Public (API Key + route_prediction permission)
 */
router.get(
  '/graph_status',
  authenticateApiKey,
  loggingMiddleware,
  requirePermission('route_prediction'),
  getGraphStatus
);

/**
 * @route   GET /api/v1/routing/graph/nodes
 * @desc    All graph nodes (id, lat, lon, visit_count)
 * @access  Public (API Key + route_prediction permission)
 */
router.get(
  '/graph/nodes',
  authenticateApiKey,
  loggingMiddleware,
  requirePermission('route_prediction'),
  getGraphNodes
);

/**
 * @route   GET /api/v1/routing/graph/edges
 * @desc    All graph edges (from/to coords, avg_speed, weight)
 * @access  Public (API Key + route_prediction permission)
 */
router.get(
  '/graph/edges',
  authenticateApiKey,
  loggingMiddleware,
  requirePermission('route_prediction'),
  getGraphEdges
);

module.exports = router;
