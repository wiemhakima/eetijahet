const rv = require('./responseView');

exports.overview  = (data) => rv.success(data);
exports.chart     = (data) => rv.success(data);
exports.finances  = (data) => rv.success(data);
exports.summary   = (data) => rv.success(data);

exports.badRequest = (msg) => rv.badRequest(msg);
exports.notFound   = (msg = 'Stats not found') => rv.notFound(msg);
