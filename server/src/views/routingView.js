const rv = require('./responseView');

exports.route = (data) =>
  rv.success({
    path:      data.path,
    waypoints: data.waypoints,
    distance:  data.distance,
    eta:       data.eta,
    fallback:  data.fallback ?? false,
  });

exports.eta = (minutes, distance) =>
  rv.success({ eta_minutes: minutes, distance_km: distance });

exports.graphStatus = (status) =>
  rv.success(status);

exports.rebuildStarted = (msg) =>
  rv.success({ message: msg });

exports.nodes = (nodes) =>
  rv.success({ nodes, count: nodes.length });

exports.edges = (edges) =>
  rv.success({ edges, count: edges.length });

exports.snapped = (points) =>
  rv.success({ snapped: points, count: points.length });

exports.notFound   = (msg = 'Route not found') => rv.notFound(msg);
exports.badRequest = (msg)                      => rv.badRequest(msg);
exports.unavailable = (msg)                     => rv.serverError(msg);
