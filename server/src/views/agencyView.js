const rv = require('./responseView');

const _shapeAgency = (a) => ({
  _id:          a._id,
  name:         a.name,
  email:        a.email,
  phone:        a.phone,
  address:      a.address,
  logo:         a.logo,
  status:       a.status,
  trialEndsAt:  a.trialEndsAt,
  settings:     a.settings,
  city:         a.city,
  zones:        a.zones,
  workingHours: a.workingHours,
  subscription: a.subscription,
  createdAt:    a.createdAt,
});

const _shapeDriver = (d) => ({
  _id:       d._id,
  firstName: d.firstName,
  lastName:  d.lastName,
  email:     d.email,
  phone:     d.phone,
  status:    d.status,
  vehicle:   d.vehicle,
  location:  d.location,
  createdAt: d.createdAt,
});

const _shapeMerchant = (m) => ({
  _id:         m._id,
  name:        m.name || `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim(),
  email:       m.email,
  phone:       m.phone,
  address:     m.address,
  isActive:    m.isActive,
  createdAt:   m.createdAt,
});

const _shapeDelivery = (d) => ({
  _id:          d._id,
  orderId:      d.orderId,
  clientStatus: d.clientStatus,
  client:       d.client,
  driver:       d.driver,
  pickupLabel:  d.pickupLabel,
  dropoffLabel: d.dropoffLabel,
  estimatedPrice: d.estimatedPrice,
  createdAt:    d.createdAt,
});

exports.agency       = (a)               => rv.success(_shapeAgency(a));
exports.agencySaved  = (a)               => rv.success(_shapeAgency(a));
exports.agencyList   = (list, pagination) => rv.success({ agencies: list.map(_shapeAgency), pagination });

exports.driverList   = (list, pagination) => rv.success({ drivers: list.map(_shapeDriver), pagination });
exports.driver       = (d)               => rv.success(_shapeDriver(d));
exports.driverSaved  = (d)               => rv.success(_shapeDriver(d));
exports.driverDeleted = ()               => rv.deleted('Driver deleted successfully');

exports.merchantList  = (list, pagination) => rv.success({ merchants: list.map(_shapeMerchant), pagination });
exports.merchant      = (m)              => rv.success(_shapeMerchant(m));
exports.merchantSaved = (m)              => rv.success(_shapeMerchant(m));
exports.merchantDeleted = ()             => rv.deleted('Merchant deleted successfully');

exports.deliveryList  = (list, pagination) => rv.success({ deliveries: list.map(_shapeDelivery), pagination });
exports.delivery      = (d)              => rv.success(_shapeDelivery(d));
exports.deliverySaved = (d)              => rv.success(_shapeDelivery(d));

exports.stats         = (data)           => rv.success(data);
exports.settings      = (data)           => rv.success(data);
exports.settingsSaved = (data)           => rv.success(data);

exports.notFound   = (msg = 'Not found') => rv.notFound(msg);
exports.badRequest = (msg)               => rv.badRequest(msg);
exports.conflict   = (msg)               => rv.conflict(msg);
