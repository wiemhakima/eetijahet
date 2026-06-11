const rv = require('./responseView');

const _shape = (n) => ({
  _id:       n._id,
  title:     n.title,
  message:   n.message,
  type:      n.type,
  isRead:    n.isRead,
  global:    n.global,
  user:      n.user,
  createdAt: n.createdAt,
});

exports.list    = (items, pagination) => rv.success({ notifications: items.map(_shape), pagination });
exports.one     = (n)                 => rv.success(_shape(n));
exports.sent    = (n)                 => rv.created(_shape(n));
exports.marked  = (n)                 => rv.success(_shape(n));
exports.deleted = ()                  => rv.deleted('Notification deleted');
exports.broadcast = (n)               => rv.created({ notification: _shape(n), message: 'Broadcasted to all users' });
exports.unreadCount = (count)         => rv.success({ unread: count });

exports.notFound   = (msg = 'Notification not found') => rv.notFound(msg);
exports.badRequest = (msg)                             => rv.badRequest(msg);
