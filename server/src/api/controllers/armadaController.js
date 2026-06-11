const armadaService              = require('../../services/armadaService');
const { extractFields }          = require('../../services/armadaService');
const ArmadaOrder                = require('../../models/ArmadaOrder');
const Merchant                   = require('../../models/Merchant');
const logger                     = require('../../utils/logger');
const rv = require('../../views/responseView');
const armadaView = require('../../views/armadaView');

exports.createOrder = async (req, res) => {
  try {
    const order = await armadaService.createOrder(req.body, req.user?.id);
    return rv.send(res, rv.created(order));
  } catch (err) {
    logger.error(`Armada createOrder error: ${err.message}`);
    // Local guard errors (inactive merchant, no profile) carry statusCode
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    // External Armada API errors — forward status with a readable message
    const status = err.response?.status || 500;
    const message = err.response?.status === 403
      ? 'Order rejected by the delivery platform (403). Verify the merchant is registered on Armada and the account is active.'
      : err.response?.data?.message || err.message;
    return res.status(status).json({ error: message });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const merchantDoc = req.user?.id
      ? await Merchant.findOne({ user: req.user.id }, '_id')
      : null;
    const result = await armadaService.listOrders({ status, page, limit, merchantId: merchantDoc?._id });
    return rv.send(res, rv.success(result));
  } catch (err) {
    logger.error(`Armada listOrders error: ${err.message}`);
    return rv.send(res, rv.serverError(err.message));
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await armadaService.getOrderById(req.params.id);
    if (!order) return rv.send(res, armadaView.notFound('Order not found'));
    return rv.send(res, rv.success(order));
  } catch (err) {
    logger.error(`Armada getOrder error: ${err.message}`);
    return rv.send(res, err.name === 'CastError' ? rv.badRequest(err.message) : rv.serverError(err.message));
  }
};

exports.saveOrder = async (req, res) => {
  try {
    const body = req.body;
    await ArmadaOrder.create({
      armadaId: body._id || body.id || null,
      status:   body.orderStatus || body.status || 'pending',
      raw:      body,
      ...extractFields(body),
    });
    return rv.send(res, rv.created({ saved: true }));
  } catch (err) {
    logger.error(`saveOrder error: ${err.message}`);
    return rv.send(res, rv.serverError(err.message));
  }
};

exports.syncOrders = async (req, res) => {
  try {
    const result = await armadaService.syncOrders();
    return rv.send(res, rv.success(result));
  } catch (err) {
    logger.error(`Armada syncOrders error: ${err.message}`);
    const status = err.response?.status || 500;
    return res.status(status).json({ error: err.response?.data?.message || err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return rv.send(res, rv.badRequest('status is required'));
    const order = await armadaService.updateStatus(req.params.id, status);
    if (!order) return rv.send(res, armadaView.notFound('Order not found'));
    return rv.send(res, rv.success(order));
  } catch (err) {
    logger.error(`Armada updateStatus error: ${err.message}`);
    return rv.send(res, err.name === 'CastError' ? rv.badRequest(err.message) : rv.serverError(err.message));
  }
};
