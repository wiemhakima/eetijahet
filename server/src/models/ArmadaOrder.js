const mongoose = require('mongoose');

const armadaOrderSchema = new mongoose.Schema(
  {
    armadaId:           { type: String, index: true },
    code:               { type: String, default: null },
    status:             { type: String, default: 'pending', index: true },
    customerName:       { type: String, default: null },
    customerPhone:      { type: String, default: null },
    destinationCity:    { type: String, default: null },
    destinationAddress: { type: String, default: null },
    productAmount:      { type: Number, default: 0 },
    deliveryFee:        { type: Number, default: 0 },
    commissionRate:     { type: Number, default: 0 },
    commissionAmount:   { type: Number, default: 0 },
    trackingLink:       { type: String, default: null },
    driverName:         { type: String, default: null },
    driverPhone:        { type: String, default: null },
    channel:            { type: String, default: null, index: true },
    merchant:           { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', index: true },
    agency:             { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
    raw:                { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

armadaOrderSchema.index({ agency: 1, status: 1 });
armadaOrderSchema.index({ agency: 1, createdAt: -1 });
armadaOrderSchema.index({ merchant: 1, createdAt: -1 });

module.exports = mongoose.model('ArmadaOrder', armadaOrderSchema);
