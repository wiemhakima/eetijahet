/**
 * Credit Transaction model
 * Tracks all credit purchases, deductions, bonuses, and refunds
 */
const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['purchase', 'deduction', 'bonus', 'refund'],
    required: true
  },
  credits: {
    type: Number,
    required: true,
    description: 'Positive for additions, negative for deductions'
  },
  balance: {
    type: Number,
    required: true,
    description: 'Credit balance after this transaction'
  },
  description: {
    type: String,
    required: true
  },
  // For purchases
  packageId: {
    type: String,
    description: 'ID of the credit package purchased'
  },
  packageName: {
    type: String,
    description: 'Name of the credit package'
  },
  amountPaid: {
    type: Number,
    description: 'Amount paid in USD for purchases'
  },
  // For deductions (daily aggregated usage)
  requestCount: {
    type: Number,
    description: 'Number of API requests in this deduction'
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'credit-transactions'
});

// Indexes for efficient queries
creditTransactionSchema.index({ userId: 1, createdAt: -1 });
creditTransactionSchema.index({ userId: 1, type: 1 });

const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);

module.exports = CreditTransaction;
