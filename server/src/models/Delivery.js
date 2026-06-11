/**
 * Delivery model
 */
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const VALID_STATUSES = ['going_to_pickup', 'picked_up', 'on_the_way', 'delivered', 'failed'];
const CLIENT_STATUSES = ['broadcasting', 'pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

const deliverySchema = new mongoose.Schema({
  // ── Driver status (legacy / driver app) ──────────────────────────────────
  status: {
    type: String,
    enum: VALID_STATUSES,
    default: 'going_to_pickup',
  },
  lastLat: { type: Number },
  lastLng: { type: Number },
  eta_predicted_seconds: { type: Number },
  actual_time_seconds:   { type: Number },
  gps_trace: [
    {
      lat:       { type: Number },
      lng:       { type: Number },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  completed_at: { type: Date },

  // ── Client order fields ───────────────────────────────────────────────────
  orderId:       { type: String, sparse: true },
  trackingCode:  { type: String, unique: true, sparse: true, index: true },
  // Human-readable address strings (used when lat/lng are not available)
  pickupAddress:  { type: String, trim: true },
  dropoffAddress: { type: String, trim: true },
  // Tenant reference — required for multi-tenant data isolation
  agency:        { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
  client:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driver:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  pickupLat:     { type: Number },
  pickupLng:     { type: Number },
  pickupLabel:   { type: String, trim: true },

  dropoffLat:    { type: Number },
  dropoffLng:    { type: Number },
  dropoffLabel:  { type: String, trim: true },

  packageType:   { type: String, enum: ['document', 'small', 'medium', 'large', 'fragile', 'food'] },
  notes:         { type: String, trim: true },
  desiredDate:   { type: Date },

  estimatedPrice: { type: Number },
  distance_km:    { type: Number },
  eta_minutes:    { type: Number },

  clientStatus: {
    type: String,
    enum: CLIENT_STATUSES,
    default: 'pending',
  },

  // ── Merchant order fields ─────────────────────────────────────────────────
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    default: null,
  },

  // Walk-in client info (for merchant orders where client is not a registered user)
  clientInfo: {
    name:  { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
  },

  // Product value (basis for commission calculation)
  productPrice: {
    type: Number,
    default: 0,
  },

  // Commission amount owed to the agency
  merchantCommission: {
    type: Number,
    default: 0,
  },

  // Delivery fee charged to the client (separate from product price)
  deliveryPrice: {
    type: Number,
    default: 0,
  },

  // ── Broadcast fields ─────────────────────────────────────────────────────────
  broadcastedAt:    { type: Date },
  broadcastExpiresAt: { type: Date },
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── Armada Delivery integration ───────────────────────────────────────────────
  armadaOrderId:    { type: String },
  armadaStatus:     { type: String },
  armadaTrackingUrl:{ type: String },

  // ── Public tracking token (UUID v4, sent via email link) ─────────────────────
  tracking_token:         { type: String, unique: true, sparse: true, index: true },
  tracking_email_sent_at: { type: Date },
}, {
  timestamps: true,
  collection: 'deliveries',
});

deliverySchema.index({ status: 1 });
deliverySchema.index({ createdAt: -1 });
deliverySchema.index({ client: 1, createdAt: -1 });
deliverySchema.index({ agency: 1, createdAt: -1 });

// Auto-generate tracking_token on first save if missing
deliverySchema.pre('save', function (next) {
  if (!this.tracking_token) {
    this.tracking_token = randomUUID();
  }
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);
module.exports.VALID_STATUSES = VALID_STATUSES;
module.exports.CLIENT_STATUSES = CLIENT_STATUSES;
