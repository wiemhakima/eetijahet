const rv = require('./responseView');

exports.delivery = (d) =>
  rv.success({
    orderId:      d.orderId,
    trackingToken: d.trackingToken,
    status:       d.clientStatus,
    driver:       d.driver ? {
      firstName: d.driver.firstName,
      lastName:  d.driver.lastName,
      location:  d.driver.location,
    } : null,
    pickup:  { label: d.pickupLabel,  lat: d.pickupLat,  lng: d.pickupLng  },
    dropoff: { label: d.dropoffLabel, lat: d.dropoffLat, lng: d.dropoffLng },
    eta_minutes: d.eta_minutes,
    updatedAt:   d.updatedAt,
  });

exports.notFound   = (msg = 'Delivery not found') => rv.notFound(msg);
exports.badRequest = (msg)                         => rv.badRequest(msg);
