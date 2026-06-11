const rv = require('./responseView');

const _shapeUser = (u) => ({
  _id:        u._id,
  firstName:  u.firstName,
  lastName:   u.lastName,
  email:      u.email,
  role:       u.role,
  tier:       u.tier || 'free',
  company:    u.company,
  createdAt:  u.createdAt,
  updatedAt:  u.updatedAt,
  activeApiSettings: u.activeApiSettings ? {
    _id:                     u.activeApiSettings._id,
    totalCredits:            u.activeApiSettings.totalCredits,
    usedCredits:             u.activeApiSettings.usedCredits,
    totalRequests:           u.activeApiSettings.totalRequests,
    successfulRequestsCount: u.activeApiSettings.successfulRequestsCount,
    failedRequestsCount:     u.activeApiSettings.failedRequestsCount,
    requestsPerMinute:       u.activeApiSettings.requestsPerMinute,
    requestsPerHour:         u.activeApiSettings.requestsPerHour,
    requestsPerDay:          u.activeApiSettings.requestsPerDay,
    concurrentRequests:      u.activeApiSettings.concurrentRequests,
  } : null,
});

const _shapeDelivery = (d) => ({
  _id:           d._id,
  orderId:       d.orderId,
  clientStatus:  d.clientStatus,
  client:        d.client,
  driver:        d.driver,
  pickupLabel:   d.pickupLabel,
  dropoffLabel:  d.dropoffLabel,
  estimatedPrice: d.estimatedPrice,
  distance_km:   d.distance_km,
  eta_minutes:   d.eta_minutes,
  createdAt:     d.createdAt,
  updatedAt:     d.updatedAt,
});

exports.userList = (users, pagination) =>
  rv.success({ users: users.map(_shapeUser), pagination });

exports.user = (u) =>
  rv.success(_shapeUser(u));

exports.userSaved = (u) =>
  rv.success(_shapeUser(u));

exports.userDeleted = () =>
  rv.deleted('User deleted successfully');

exports.impersonated = (user, token) =>
  rv.success({ user: _shapeUser(user), token, expiresIn: '15m' });

exports.stats = (data) =>
  rv.success(data);

exports.deliveryList = (deliveries, pagination) =>
  rv.success({ deliveries: deliveries.map(_shapeDelivery), pagination });

exports.delivery = (d) =>
  rv.success(_shapeDelivery(d));

exports.notFound   = (msg = 'Not found')    => rv.notFound(msg);
exports.badRequest = (msg)                  => rv.badRequest(msg);
exports.conflict   = (msg)                  => rv.conflict(msg);
