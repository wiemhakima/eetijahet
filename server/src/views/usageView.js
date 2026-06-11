const rv = require('./responseView');

exports.summary  = (data)              => rv.success(data);
exports.logs     = (items, pagination) => rv.success({ logs: items, pagination });
exports.chart    = (series)            => rv.success({ series });
exports.quotas   = (data)              => rv.success(data);

exports.notFound   = (msg = 'Usage data not found') => rv.notFound(msg);
exports.badRequest = (msg)                           => rv.badRequest(msg);
