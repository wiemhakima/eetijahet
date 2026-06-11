const rv = require('./responseView');

const _shape = (s) => ({
  id:          s._id,
  plan:        s.plan,
  status:      s.status,
  startDate:   s.startDate,
  endDate:     s.endDate,
  autoRenew:   s.autoRenew,
  price:       s.price,
  currency:    s.currency,
  features:    s.features,
  createdAt:   s.createdAt,
});

exports.one      = (s)              => rv.success(_shape(s));
exports.created  = (s)              => rv.created(_shape(s));
exports.saved    = (s)              => rv.success(_shape(s));
exports.cancelled = (s)             => rv.success({ ...(_shape(s)), message: 'Subscription cancelled' });
exports.plans    = (plans)          => rv.success({ plans });
exports.checkout = (url, sessionId) => rv.success({ url, sessionId });
exports.webhook  = ()               => rv.success({ received: true });

exports.notFound   = (msg = 'Subscription not found') => rv.notFound(msg);
exports.badRequest = (msg)                             => rv.badRequest(msg);
