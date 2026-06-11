const rv = require('./responseView');

const _shapeOrder = (o) => ({
  id:           o._id,
  orderId:      o.orderId,
  status:       o.status || o.clientStatus,
  client:       o.client,
  driver:       o.driver,
  items:        o.items,
  totalAmount:  o.totalAmount,
  deliveryFee:  o.deliveryFee,
  pickupLabel:  o.pickupLabel,
  dropoffLabel: o.dropoffLabel,
  notes:        o.notes,
  createdAt:    o.createdAt,
});

const _shapeMerchant = (m) => ({
  id:        m._id,
  name:      m.name,
  email:     m.email,
  phone:     m.phone,
  address:   m.address,
  isActive:  m.isActive,
  agency:    m.agency,
  createdAt: m.createdAt,
});

exports.merchant      = (m)               => rv.success(_shapeMerchant(m));
exports.merchantSaved = (m)               => rv.success(_shapeMerchant(m));
exports.merchantList  = (list, pagination) => rv.success({ merchants: list.map(_shapeMerchant), pagination });
exports.merchantDeleted = ()              => rv.deleted('Merchant deleted');

exports.order       = (o)               => rv.success(_shapeOrder(o));
exports.orderCreated = (o)              => rv.created(_shapeOrder(o));
exports.orderSaved  = (o)               => rv.success(_shapeOrder(o));
exports.orderList   = (list, pagination) => rv.success({ orders: list.map(_shapeOrder), pagination });
exports.orderDeleted = ()               => rv.deleted('Order deleted');

exports.stats      = (data) => rv.success(data);
exports.notFound   = (msg = 'Not found') => rv.notFound(msg);
exports.badRequest = (msg)               => rv.badRequest(msg);
