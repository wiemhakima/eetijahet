const rv = require('./responseView');

const _shape = (o) => ({
  id:          o._id,
  orderId:     o.orderId,
  status:      o.status,
  merchant:    o.merchant,
  driver:      o.driver,
  items:       o.items,
  totalAmount: o.totalAmount,
  pickup:      o.pickup,
  dropoff:     o.dropoff,
  route:       o.route,
  createdAt:   o.createdAt,
});

exports.list    = (items, pagination) => rv.success({ orders: items.map(_shape), pagination });
exports.one     = (o)                 => rv.success(_shape(o));
exports.created = (o)                 => rv.created(_shape(o));
exports.saved   = (o)                 => rv.success(_shape(o));
exports.deleted = ()                  => rv.deleted('Order deleted');
exports.optimized = (result)          => rv.success({ result });
exports.stats   = (data)              => rv.success(data);

exports.notFound   = (msg = 'Order not found') => rv.notFound(msg);
exports.badRequest = (msg)                      => rv.badRequest(msg);
