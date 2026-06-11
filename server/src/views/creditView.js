const rv = require('./responseView');

const _shapeTx = (t) => ({
  id:          t._id,
  amount:      t.amount,
  type:        t.type,
  description: t.description,
  balance:     t.balanceAfter,
  createdAt:   t.createdAt,
});

const _shapeSettings = (s) => ({
  id:            s._id,
  totalCredits:  s.totalCredits,
  usedCredits:   s.usedCredits,
  remaining:     (s.totalCredits || 0) - (s.usedCredits || 0),
  requestsPerMinute: s.requestsPerMinute,
  requestsPerHour:   s.requestsPerHour,
  requestsPerDay:    s.requestsPerDay,
  concurrentRequests: s.concurrentRequests,
});

exports.balance      = (settings)         => rv.success(_shapeSettings(settings));
exports.settings     = (settings)         => rv.success(_shapeSettings(settings));
exports.settingsSaved = (settings)        => rv.success(_shapeSettings(settings));
exports.txList       = (txs, pagination)  => rv.success({ transactions: txs.map(_shapeTx), pagination });
exports.topUp        = (settings, tx)     => rv.success({ settings: _shapeSettings(settings), transaction: _shapeTx(tx) });
exports.deducted     = (remaining)        => rv.success({ remaining });

exports.notFound   = (msg = 'Credits not found') => rv.notFound(msg);
exports.badRequest = (msg)                        => rv.badRequest(msg);
exports.insufficient = ()                         => rv.badRequest('Insufficient credits');
