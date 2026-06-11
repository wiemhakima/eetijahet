/**
 * API Key model
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'API key name is required'],
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Tenant reference — scopes the API key to a specific agency
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    default: null,
    index: true,
  },
  created: {
    type: Date,
    default: Date.now
  },
  expires: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  permissions: {
    type: [String],
    enum: ['time_estimation', 'distance_estimation', 'combined_model', 'route_prediction'],
    default: ['time_estimation', 'distance_estimation', 'combined_model', 'route_prediction']
  },
  lastUsed: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries (key already indexed via unique:true above)
apiKeySchema.index({ userId: 1 });

// Static method to generate a new API key
apiKeySchema.statics.generateApiKey = function() {
  const prefix = 'ak_';
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${prefix}${randomBytes}`;
};

// Method to check if the API key is expired
apiKeySchema.methods.isExpired = function() {
  if (!this.expires) return false;
  return new Date() > this.expires;
};

// Method to update lastUsed timestamp
apiKeySchema.methods.updateLastUsed = async function() {
  this.lastUsed = new Date();
  await this.save();
};

// Pre-save hook to check expiration and update status
apiKeySchema.pre('save', function(next) {
  if (this.expires && new Date() > this.expires) {
    this.status = 'expired';
  }
  next();
});

const ApiKey = mongoose.model('ApiKey', apiKeySchema, 'api-keys');

module.exports = ApiKey;
