/**
 * Merchant model
 * Represents a store/merchant linked to an agency with a commission rate.
 */
const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
  },

  // The user account (role: 'merchant') that logs in
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // Parent agency
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    index: true,
  },

  // Commission percentage charged on product price
  commission: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10,
  },

  address: {
    street: { type: String, trim: true, default: '' },
    city:   { type: String, trim: true, default: '' },
    lat:    { type: Number },
    lng:    { type: Number },
  },

  stats: {
    totalOrders:     { type: Number, default: 0 },
    totalRevenue:    { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
  },

  logo: {
    type: String,
    trim: true,
    default: '',
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  isOnline: {
    type: Boolean,
    default: false,
  },

  lastSeen: {
    type: Date,
  },
}, {
  timestamps: true,
});

merchantSchema.index({ agency: 1, createdAt: -1 });

module.exports = mongoose.model('Merchant', merchantSchema);
