const axios       = require('axios');
const ArmadaOrder = require('../models/ArmadaOrder');
const Merchant    = require('../models/Merchant');

const BASE_URL = () => process.env.ARMADA_BASE_URL || 'https://sandbox.api.armadadelivery.com';

const headers = () => ({
  Token:          process.env.ARMADA_TOKEN,
  'Content-Type': 'application/json',
});

// Extract structured display fields from any Armada order payload
function extractFields(body) {
  return {
    code:               body.code                                                   || null,
    customerName:       body.customerName                                           || null,
    customerPhone:      body.customerPhone                                          || null,
    destinationCity:    body.customerAddress?.city    || body.address?.city         || null,
    destinationAddress: body.customerAddress?.firstLine || body.address?.firstLine  || null,
    productAmount:      body.amount      != null ? Number(body.amount)      : 0,
    deliveryFee:        body.deliveryFee != null ? Number(body.deliveryFee) : 0,
    trackingLink:       body.trackingLink                                           || null,
    driverName:         body.driverName                                             || null,
    driverPhone:        body.driverPhone                                            || null,
    channel:            body.channel                                                || null,
  };
}

exports.extractFields = extractFields;

exports.createOrder = async (body, userId) => {
  // Verify the merchant exists and is active before hitting the external Armada API
  const merchantDoc = userId
    ? await Merchant.findOne({ user: userId }).populate('agency', '_id name status')
    : null;

  if (!merchantDoc) {
    const err = new Error('Merchant profile not found for this user. Contact your agency admin.');
    err.statusCode = 403;
    throw err;
  }
  if (!merchantDoc.isActive) {
    const err = new Error('Your merchant account is inactive. Contact your agency admin.');
    err.statusCode = 403;
    throw err;
  }

  const { data } = await axios.post(`${BASE_URL()}/orders`, body, { headers: headers() });

  const fields         = extractFields(data);
  const commissionRate = merchantDoc?.commission ?? 0;
  const commissionAmount = Math.round(fields.productAmount * commissionRate) / 100;

  const savedOrder = await ArmadaOrder.create({
    armadaId:        data._id || data.id,
    status:          data.orderStatus || data.status || 'pending',
    merchant:        merchantDoc?._id   ?? null,
    agency:          merchantDoc?.agency?._id ?? null,
    commissionRate,
    commissionAmount,
    raw:             data,
    ...fields,
  });

  if (merchantDoc?.agency?._id) {
    try {
      const socket = require('../socket');
      socket.notifyAgency(String(merchantDoc.agency._id), 'new_order', {
        type:         'new_order',
        title:        'Nouvelle commande reçue',
        message:      `${merchantDoc.storeName ?? 'Un marchand'} a créé une commande de ${fields.productAmount} KWD`,
        orderId:      savedOrder._id,
        code:         savedOrder.code,
        merchantName: merchantDoc.storeName,
        amount:       fields.productAmount,
        deliveryFee:  fields.deliveryFee,
        createdAt:    savedOrder.createdAt,
        sound:        true,
      });
    } catch (_) {}
  }

  return data;
};

exports.listOrders = async ({ status, page = 1, limit = 20, merchantId } = {}) => {
  const filter = {};
  if (merchantId) filter.merchant = merchantId;
  if (status) {
    filter.status = status === 'delivered' ? { $in: ['delivered', 'completed'] } : status;
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    ArmadaOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    ArmadaOrder.countDocuments(filter),
  ]);
  return { orders, total, page: Number(page), limit: Number(limit) };
};

exports.getOrderById = async (id) => ArmadaOrder.findById(id);

exports.updateStatus = async (id, status) =>
  ArmadaOrder.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

exports.syncOrders = async () => {
  let data;
  try {
    ({ data } = await axios.get(`${BASE_URL()}/orders`, { headers: headers() }));
  } catch (err) {
    return { fetched: 0, saved: 0 };
  }
  const orders = Array.isArray(data) ? data : (data.orders || data.data || []);

  if (orders.length === 0) return { fetched: 0, saved: 0 };

  const ops = orders.map((order) => ({
    updateOne: {
      filter: { armadaId: order._id || order.id },
      update: {
        $set:         { status: order.orderStatus || order.status || 'pending' },
        $setOnInsert: {
          armadaId: order._id || order.id,
          raw:      order,
          ...extractFields(order),
        },
      },
      upsert: true,
    },
  }));

  const result = await ArmadaOrder.bulkWrite(ops, { ordered: false });
  return { fetched: orders.length, saved: result.upsertedCount };
};

// Legacy helpers
exports.createArmadaOrder = exports.createOrder;
exports.getOrder          = exports.getOrderById;
