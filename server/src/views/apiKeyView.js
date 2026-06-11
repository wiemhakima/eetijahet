const rv = require('./responseView');

const _shape = (k) => ({
  _id:         k._id,
  key:         k.key,
  name:        k.name,
  prefix:      k.prefix,
  status:      k.status,
  permissions: k.permissions,
  lastUsed:    k.lastUsedAt,
  created:     k.createdAt,
  expires:     k.expiresAt,
});

exports.list    = (keys)          => rv.success({ keys: keys.map(_shape) });
exports.one     = (k)             => rv.success(_shape(k));
exports.created = (k, rawKey)     => rv.created({ key: rawKey, details: _shape(k) });
exports.revoked = ()              => rv.success({ message: 'API key revoked' });
exports.deleted = ()              => rv.deleted('API key deleted');

exports.notFound   = (msg = 'API key not found') => rv.notFound(msg);
exports.badRequest = (msg)                        => rv.badRequest(msg);
exports.conflict   = (msg)                        => rv.conflict(msg);
