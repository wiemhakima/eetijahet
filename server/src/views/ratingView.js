const rv = require('./responseView');

const _shape = (r) => ({
  _id:      r._id,
  stars:    r.stars,
  comment:  r.comment,
  delivery: r.delivery,
  client:   r.client,
  driver:   r.driver,
  createdAt: r.createdAt,
});

exports.list    = (items, pagination) => rv.success({ ratings: items.map(_shape), pagination });
exports.one     = (r)                 => rv.success(_shape(r));
exports.created = (r)                 => rv.created(_shape(r));
exports.average = (avg, count)        => rv.success({ average: avg, count });

exports.notFound   = (msg = 'Rating not found') => rv.notFound(msg);
exports.badRequest = (msg)                       => rv.badRequest(msg);
