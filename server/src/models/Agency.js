const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Agency name is required'],
    trim: true,
  },
  // Arabic name for Kuwait market
  nameAr: {
    type: String,
    trim: true,
    default: '',
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Agency email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  logo: {
    type: String,
    trim: true,
  },
  // Kuwait marketplace fields
  currency: {
    type: String,
    default: 'KWD',
  },
  priceBase: {
    type: Number,
    default: 1.5,   // Base price in KWD
  },
  coverageZones: {
    type: [String],
    default: [],
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial'],
    default: 'trial',
  },
  trialEndsAt: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
  },
  // Limits derived from the active plan — cached here for fast middleware checks
  settings: {
    maxDrivers:       { type: Number, default: 5 },
    maxDeliveries:    { type: Number, default: 100 },
    apiAccess:        { type: Boolean, default: false },
    apiRequestsLimit: { type: Number, default: 0 },
  },
  // Monthly usage counters — reset at the start of each billing month
  usage: {
    deliveriesThisMonth: { type: Number, default: 0 },
    lastResetDate:       { type: Date,   default: Date.now },
  },

  // ── Agency Profile ──────────────────────────────────────────────────────────
  profile: {
    name:        String,
    logo:        String,
    description: String,
    address: {
      street:     String,
      city:       String,
      governorate: String,
      country:    { type: String, default: 'Kuwait' },
      lat:        Number,
      lng:        Number,
    },
    phone:    String,
    email:    String,
    website:  String,
    socialMedia: {
      instagram: String,
      twitter:   String,
      facebook:  String,
    },
  },

  // ── Delivery Zones & Pricing ────────────────────────────────────────────────
  deliveryZones: [{
    name:        String,
    governorate: String,
    isActive:    { type: Boolean, default: true },
    pricing: {
      basePrice:  { type: Number, default: 1 },
      pricePerKm: { type: Number, default: 0.250 },
      minimumFee: { type: Number, default: 1 },
      expressFee: { type: Number, default: 0.500 },
    },
  }],

  defaultPricing: {
    basePrice:  { type: Number, default: 1 },
    pricePerKm: { type: Number, default: 0.300 },
    minimumFee: { type: Number, default: 1 },
    expressFee: { type: Number, default: 0.500 },
  },

  // ── Working Hours ───────────────────────────────────────────────────────────
  workingHours: {
    is24_7: { type: Boolean, default: false },
    schedule: {
      sunday:    { isOpen: { type: Boolean, default: true  }, open: { type: String, default: '08:00' }, close: { type: String, default: '22:00' }, breakStart: String, breakEnd: String },
      monday:    { isOpen: { type: Boolean, default: true  }, open: { type: String, default: '08:00' }, close: { type: String, default: '22:00' }, breakStart: String, breakEnd: String },
      tuesday:   { isOpen: { type: Boolean, default: true  }, open: { type: String, default: '08:00' }, close: { type: String, default: '22:00' }, breakStart: String, breakEnd: String },
      wednesday: { isOpen: { type: Boolean, default: true  }, open: { type: String, default: '08:00' }, close: { type: String, default: '22:00' }, breakStart: String, breakEnd: String },
      thursday:  { isOpen: { type: Boolean, default: true  }, open: { type: String, default: '08:00' }, close: { type: String, default: '22:00' }, breakStart: String, breakEnd: String },
      friday:    { isOpen: { type: Boolean, default: false }, open: String, close: String },
      saturday:  { isOpen: { type: Boolean, default: true  }, open: { type: String, default: '08:00' }, close: { type: String, default: '22:00' }, breakStart: String, breakEnd: String },
    },
    holidays: [{
      name:        String,
      date:        Date,
      isRecurring: Boolean,
    }],
  },

  // ── Notification Preferences ────────────────────────────────────────────────
  notifications: {
    email: {
      newOrder:       { type: Boolean, default: true  },
      orderCompleted: { type: Boolean, default: true  },
      orderCancelled: { type: Boolean, default: true  },
      dailyReport:    { type: Boolean, default: false },
      weeklyReport:   { type: Boolean, default: true  },
    },
    sms: {
      urgentAlerts: { type: Boolean, default: true },
      driverIssues: { type: Boolean, default: true },
    },
  },

  // ── Team Members ────────────────────────────────────────────────────────────
  team: [{
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role:    { type: String, enum: ['admin', 'manager'], default: 'manager' },
    permissions: {
      merchants:  { type: Boolean, default: true  },
      drivers:    { type: Boolean, default: true  },
      deliveries: { type: Boolean, default: true  },
      statistics: { type: Boolean, default: true  },
      finances:   { type: Boolean, default: false },
      settings:   { type: Boolean, default: false },
      team:       { type: Boolean, default: false },
    },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],

  // ── Integrations ────────────────────────────────────────────────────────────
  integrations: {
    googleMapsApiKey:    String,
    paymentGateway: {
      provider:  { type: String, enum: ['knet', 'stripe', 'tap', 'none'], default: 'none' },
      apiKey:    String,
      secretKey: String,
    },
    webhooks: [{
      name:     String,
      url:      String,
      events:   [String],
      isActive: { type: Boolean, default: true },
    }],
  },
}, {
  timestamps: true,
  collection: 'agencies',
});

agencySchema.index({ owner: 1 });
agencySchema.index({ status: 1 });

/**
 * Auto-generate a URL-safe slug from the agency name before saving.
 */
agencySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});


agencySchema.methods.isActive = function () {
  if (this.status === 'active') return true;
  if (this.status === 'trial' && this.trialEndsAt > new Date()) return true;
  return false;
};

const Agency = mongoose.model('Agency', agencySchema);
module.exports = Agency;
