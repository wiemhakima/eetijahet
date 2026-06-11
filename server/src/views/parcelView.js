const rv = require('./responseView');

const _shape = (p) => ({
  id:          p._id,
  trackingId:  p.trackingId,
  status:      p.status,
  weight:      p.weight,
  dimensions:  p.dimensions,
  description: p.description,
  delivery:    p.delivery,
  createdAt:   p.createdAt,
});

exports.list    = (items, pagination) => rv.success({ parcels: items.map(_shape), pagination });
exports.one     = (p)                 => rv.success(_shape(p));
exports.created = (p)                 => rv.created(_shape(p));
exports.saved   = (p)                 => rv.success(_shape(p));
exports.deleted = ()                  => rv.deleted('Parcel deleted');

exports.notFound   = (msg = 'Parcel not found') => rv.notFound(msg);
exports.badRequest = (msg)                       => rv.badRequest(msg);
