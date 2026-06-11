/**
 * Admin Routing Routes
 * Same endpoints as /api/v1/routing/* but authenticated via admin JWT
 * instead of API Key + scope. No changes to Flask Core calls or response format.
 */
const express = require('express');
const {
  predictRoute,
  getRoads,
  getGraphStatus,
  getGraphNodes,
  getGraphEdges,
  rebuildGraph,
} = require('../controllers/routingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/graph_status',   getGraphStatus);
router.get('/roads',          getRoads);
router.get('/graph/nodes',    getGraphNodes);
router.get('/graph/edges',    getGraphEdges);
router.post('/predict_route', predictRoute);
router.post('/rebuild_graph', rebuildGraph);

module.exports = router;
