/**
 * Subscription model — one record per agency, tracks the active plan and billing cycle.
 */
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  amount:     { type: Number, required: true },
  currency:   { type: String, default: 'USD' },
  paidAt:     { type: Date, default: Date.now },
  invoiceUrl: { type: String },
  stripeInvoiceId: { type: String },
}, { _id: false });

const subscriptionSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    unique: true,
  },
  plan: {
    type: String,
    enum: ['basic', 'medium', 'pro'],
    required: true,
  },
  billing: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly',
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'trialing'],
    default: 'trialing',
  },
  currentPeriodStart: {
    type: Date,
    default: Date.now,
  },
  currentPeriodEnd: {
    type: Date,
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  // Stripe integration fields (optional — fill when Stripe is wired up)
  stripeSubscriptionId: { type: String, default: null },
  stripeCustomerId:     { type: String, default: null },

  invoices: [invoiceSchema],
}, {
  timestamps: true,
  collection: 'subscriptions',
});

subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

/**
 * Returns true when the subscription is currently billable/active.
 */
subscriptionSchema.methods.isValid = function () {
  return ['active', 'trialing'].includes(this.status) && this.currentPeriodEnd > new Date();
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
