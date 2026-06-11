const rv = require('./responseView');

const _shape = (d) => ({
  _id:            d._id,
  orderId:        d.orderId,
  trackingCode:   d.trackingToken,
  clientStatus:   d.clientStatus,
  client:         d.client,
  driver:         d.driver,
  pickupLat:      d.pickupLat,
  pickupLng:      d.pickupLng,
  pickupLabel:    d.pickupLabel,
  pickupAddress:  d.pickupAddress,
  dropoffLat:     d.dropoffLat,
  dropoffLng:     d.dropoffLng,
  dropoffLabel:   d.dropoffLabel,
  dropoffAddress: d.dropoffAddress,
  packageType:    d.packageType,
  estimatedPrice: d.estimatedPrice,
  distance_km:    d.distance_km,
  eta_minutes:    d.eta_minutes,
  notes:          d.notes,
  desiredDate:    d.desiredDate,
  createdAt:      d.createdAt,
  updatedAt:      d.updatedAt,
});

exports.list    = (items, pagination) => rv.success({ deliveries: items.map(_shape), pagination });
exports.one     = (d)                 => rv.success(_shape(d));
exports.created = (d)                 => rv.created(_shape(d));
exports.saved   = (d)                 => rv.success(_shape(d));
exports.deleted = ()                  => rv.deleted('Delivery deleted');
exports.stats   = (data)              => rv.success(data);
exports.tracking = (d)                => rv.success(_shape(d));

exports.notFound   = (msg = 'Delivery not found') => rv.notFound(msg);
exports.badRequest = (msg)                         => rv.badRequest(msg);
