/**
 * User model
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    // Not required for phone-only clients (auto-created by agency)
    unique: true,
    sparse: true, // null emails don't conflict with each other
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    // Not required for phone-only clients (they authenticate via magic code)
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in query results by default
  },
  company: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    trim: true
  },
  agreeMarketing: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: [
      'admin',
      'developer',
      'agency_admin',
      'gestionnaire_agency',
      'merchant',
      'user',
    ],
    default: 'user',
  },
  // Tenant reference:
  //   - agency_admin / driver / user : required (must belong to a delivery agency)
  //   - admin / developer / super_admin : always null (Armada-side only)
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    default: null,
    index: true,
  },
  activeApiSettings: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserApiSettings',
    default: null
  },
  tier: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: undefined,
    select: false,
  },
  resetPasswordExpiry: {
    type: Date,
    default: undefined,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ── Role / Agency validation ──────────────────────────────────────────────────
const armadaRoles    = ['admin', 'developer', 'super_admin'];
// These roles always require an agency:
const strictAgencyRoles = ['agency_admin', 'gestionnaire_agency', 'merchant'];
// 'user' (marketplace client) may or may not be linked to an agency.

userSchema.pre('validate', function (next) {
  if (armadaRoles.includes(this.role) && this.agency != null) {
    return next(new Error('Armada-side users (admin, developer, super_admin) must not be linked to an agency.'));
  }
  if (strictAgencyRoles.includes(this.role) && this.agency == null) {
    return next(new Error('Agency staff (agency_admin, driver) must be linked to an agency.'));
  }
  next();
});

// Pre-save hook to hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
