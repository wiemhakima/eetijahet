const rv = require('./responseView');

const _shape = (a) => ({
  _id:       a._id,
  label:     a.label,
  street:    a.street,
  city:      a.city,
  lat:       a.lat,
  lng:       a.lng,
  isDefault: a.isDefault,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

exports.list    = (items)  => rv.success({ addresses: items.map(_shape) });
exports.one     = (a)      => rv.success(_shape(a));
exports.created = (a)      => rv.created(_shape(a));
exports.saved   = (a)      => rv.success(_shape(a));
exports.deleted = ()       => rv.deleted('Address deleted');

exports.notFound   = (msg = 'Address not found') => rv.notFound(msg);
exports.badRequest = (msg)                        => rv.badRequest(msg);
