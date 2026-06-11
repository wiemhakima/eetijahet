/**
 * Routing Controller
 */
const routingService = require('../../services/routingService');
const logger = require('../../utils/logger');
const { performance } = require('perf_hooks');
const fetch = require('node-fetch');
const rv = require('../../views/responseView');
const routingView = require('../../views/routingView');

const ROUTING_SERVER_URL = process.env.ROUTING_SERVER_URL || 'http://127.0.0.1:8050';

/**
 * @desc    Optimize single route
 * @route   POST /api/v1/routing/optimize
 * @access  Private (API Key required)
 */
const optimizeRoute = async (req, res, next) => {
  const startTime = performance.now();

  try {
    logger.info('Route optimization request received');
    logger.debug('Request body:', req.body);

    const result = await routingService.optimizeRoute(req.body);

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    logger.info(`Route optimization successful - Response time: ${responseTime.toFixed(2)}ms`);

    return rv.send(res, rv.success(result));
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    logger.error(`Route optimization controller error: ${error.message} - Response time: ${responseTime.toFixed(2)}ms`);
    next(error);
  }
};

/**
 * @desc    Predict route via Armada AI routing server
 * @route   POST /api/v1/routing/predict_route
 * @access  Private (API Key required)
 */
const predictRoute = async (req, res, next) => {
  try {
    const response = await fetch(`${ROUTING_SERVER_URL}/predict_route`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return rv.send(res, rv.success(data));
  } catch (error) {
    logger.error(`predictRoute error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Proxy /roads GeoJSON from Flask
 * @route   GET /api/v1/routing/roads
 * @access  Private (API Key + route_prediction permission)
 */
const getRoads = async (req, res, next) => {
  try {
    const response = await fetch(`${ROUTING_SERVER_URL}/roads`);
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    return rv.send(res, rv.success(data));
  } catch (error) {
    logger.error(`getRoads error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Proxy /graph_status from Flask
 * @route   GET /api/v1/routing/graph_status
 * @access  Private (API Key + route_prediction permission)
 */
const getGraphStatus = async (req, res, next) => {
  try {
    const response = await fetch(`${ROUTING_SERVER_URL}/graph_status`);
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    return rv.send(res, routingView.graphStatus(data));
  } catch (error) {
    logger.error(`getGraphStatus error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Proxy /graph/nodes from Flask — all graph nodes with visit_count
 * @route   GET /api/v1/routing/graph/nodes
 * @access  Private (API Key + route_prediction permission)
 */
const getGraphNodes = async (req, res, next) => {
  try {
    const response = await fetch(`${ROUTING_SERVER_URL}/graph/nodes`, { timeout: 30000 });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    return rv.send(res, routingView.nodes(data));
  } catch (error) {
    logger.error(`getGraphNodes error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Proxy /graph/edges from Flask — all graph edges with speed/weight
 * @route   GET /api/v1/routing/graph/edges
 * @access  Private (API Key + route_prediction permission)
 */
const getGraphEdges = async (req, res, next) => {
  try {
    const response = await fetch(`${ROUTING_SERVER_URL}/graph/edges`, { timeout: 30000 });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    return rv.send(res, routingView.edges(data));
  } catch (error) {
    logger.error(`getGraphEdges error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Proxy /rebuild_graph to Flask — triggers graph rebuild
 * @route   POST /api/v1/admin/routing/rebuild_graph
 * @access  Private (admin only)
 */
const rebuildGraph = async (req, res, next) => {
  try {
    const response = await fetch(`${ROUTING_SERVER_URL}/rebuild_graph`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(req.body || {}),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    return rv.send(res, routingView.rebuildStarted(data.message || 'Graph rebuild started'));
  } catch (error) {
    logger.error(`rebuildGraph error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  optimizeRoute,
  predictRoute,
  getRoads,
  getGraphStatus,
  getGraphNodes,
  getGraphEdges,
  rebuildGraph,
};
