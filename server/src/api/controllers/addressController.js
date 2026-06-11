/**
 * Address Controller — CRUD for client favorite addresses
 */
const Address = require('../../models/Address');
const logger  = require('../../utils/logger');
const rv = require('../../views/responseView');
const addressView = require('../../views/addressView');

// ── GET /api/v1/addresses ─────────────────────────────────────────────────────

exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 });
    return rv.send(res, addressView.list(addresses));
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/addresses ────────────────────────────────────────────────────

exports.createAddress = async (req, res, next) => {
  try {
    const { label, street, city, lat, lng, isDefault } = req.body;

    if (!label || lat === undefined || lng === undefined) {
      return rv.send(res, addressView.badRequest('label, lat, and lng are required'));
    }

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user:      req.user._id,
      label,
      street:    street || '',
      city:      city   || '',
      lat:       parseFloat(lat),
      lng:       parseFloat(lng),
      isDefault: !!isDefault,
    });

    return rv.send(res, addressView.created(address));
  } catch (error) {
    logger.error(`createAddress error: ${error.message}`);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return rv.send(res, addressView.badRequest(messages));
    }
    next(error);
  }
};

// ── PUT /api/v1/addresses/:id ─────────────────────────────────────────────────

exports.updateAddress = async (req, res, next) => {
  try {
    const { label, street, city, lat, lng, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const updates = {};
    if (label     !== undefined) updates.label     = label;
    if (street    !== undefined) updates.street    = street;
    if (city      !== undefined) updates.city      = city;
    if (lat       !== undefined) updates.lat       = parseFloat(lat);
    if (lng       !== undefined) updates.lng       = parseFloat(lng);
    if (isDefault !== undefined) updates.isDefault = !!isDefault;

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!address) {
      return rv.send(res, addressView.notFound());
    }

    return rv.send(res, addressView.saved(address));
  } catch (error) {
    logger.error(`updateAddress error: ${error.message}`);
    next(error);
  }
};

// ── DELETE /api/v1/addresses/:id ──────────────────────────────────────────────

exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!address) {
      return rv.send(res, addressView.notFound());
    }
    return rv.send(res, addressView.deleted());
  } catch (error) {
    next(error);
  }
};
