/**
 * Authentication controller
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const UserApiSettings = require('../../models/UserApiSettings');
const Notification = require('../../models/Notification');
const Agency = require('../../models/Agency');
const config = require('../../config');
const logger = require('../../utils/logger');
const { sendForgotPasswordEmail, sendPasswordChangedEmail } = require('../../services/emailService');
const rv = require('../../views/responseView');
const authView = require('../../views/authView');

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, agencyId: user.agency || null },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
exports.signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, company, avatar, agreeMarketing, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return rv.send(res, rv.badRequest('Email already in use'));
    }

    // First create API settings with preset values
    const apiSettings = await UserApiSettings.create({
      totalCredits: 1000,
      usedCredits: 0,
      totalRequests: 0,
      successfulRequestsCount: 0,
      failedRequestsCount: 0,
      requestsPerMinute: 500,
      requestsPerHour: 30000,
      requestsPerDay: 72000,
      concurrentRequests: 100
    });

    // Create new user with reference to API settings
    const allowedRoles = ['user', 'developer'];
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      company,
      avatar,
      agreeMarketing,
      role: allowedRoles.includes(role) ? role : 'user',
      activeApiSettings: apiSettings._id
    });

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    user.password = undefined;

    // Create welcome notification for the new user
    await Notification.create({
      title: {
        en: 'Welcome to Armada Etijahat!',
        ar: 'مرحباً بك في Armada Etijahat!',
        fr: 'Bienvenue sur Armada Etijahat!'
      },
      message: {
        en: `Welcome ${firstName}! We're excited to have you on board. Start exploring our services and let us know if you need any help.`,
        ar: `مرحباً ${firstName}! يسعدنا انضمامك إلينا. ابدأ باستكشاف خدماتنا وأخبرنا إن احتجت أي مساعدة.`,
        fr: `Bienvenue ${firstName}! Nous sommes ravis de vous accueillir. Explorez nos services et contactez-nous si vous avez besoin d'aide.`
      },
      type: 'success',
      user: user._id,
      global: false,
      isRead: false
    });

    return rv.send(res, authView.registered(user, token));
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return rv.send(res, rv.badRequest(messages.join(', ')));
    }

    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return rv.send(res, rv.badRequest('Please provide email and password'));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return rv.send(res, rv.badRequest('Invalid credentials'));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return rv.send(res, rv.badRequest('Invalid credentials'));
    }

    // Generate token
    const token = generateToken(user);

    // Get team role from agency (for agency_admin users)
    let teamRole = 'admin';
    let permissions = {};
    if (user.agency) {
      const agency = await Agency.findById(user.agency);
      const teamMember = agency?.team?.find(t => t.user.toString() === user._id.toString());
      if (teamMember) {
        teamRole = teamMember.role;
        permissions = teamMember.permissions || {};
      }
    }

    // Mark merchant as online in the DB (provides initial state before socket events arrive)
    if (user.role === 'merchant') {
      const Merchant = require('../../models/Merchant');
      await Merchant.findOneAndUpdate(
        { user: user._id },
        { isOnline: true, lastSeen: new Date() },
      ).catch(() => {});
    }

    const userData = user.toObject ? user.toObject() : { ...user._doc };
    delete userData.password;
    userData.teamRole = teamRole;
    userData.permissions = permissions;

    return rv.send(res, { statusCode: 200, success: true, token, data: userData });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('activeApiSettings');

    let teamRole = 'admin';
    let permissions = {};
    if (user.agency) {
      const agency = await Agency.findById(user.agency);
      const teamMember = agency?.team?.find(t => t.user.toString() === user._id.toString());
      if (teamMember) {
        teamRole = teamMember.role;
        permissions = teamMember.permissions || {};
      }
    }

    if (user.role === 'merchant') {
      const Merchant = require('../../models/Merchant');
      await Merchant.findOneAndUpdate(
        { user: user._id },
        { isOnline: true, lastSeen: new Date() },
      ).catch(() => {});
    }

    const userData = user.toObject ? user.toObject() : { ...user._doc };
    userData.teamRole = teamRole;
    userData.permissions = permissions;

    return rv.send(res, rv.success(userData));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'company', 'agreeMarketing'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return rv.send(res, rv.badRequest('No valid fields to update'));
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return rv.send(res, rv.notFound('User not found'));
    }

    return rv.send(res, authView.updated(user));
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return rv.send(res, rv.badRequest(messages.join(', ')));
    }
    next(error);
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/v1/auth/password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return rv.send(res, rv.badRequest('Please provide current password and new password'));
    }

    if (newPassword.length < 8) {
      return rv.send(res, rv.badRequest('New password must be at least 8 characters long'));
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return rv.send(res, rv.notFound('User not found'));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return rv.send(res, rv.badRequest('Current password is incorrect'));
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user);

    return rv.send(res, rv.success({ token, message: 'Password changed successfully' }));
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    logger.info(`User ${req.user.email} logged out`);

    if (req.user.role === 'merchant') {
      const Merchant = require('../../models/Merchant');
      await Merchant.findOneAndUpdate(
        { user: req.user._id },
        { isOnline: false, lastSeen: new Date() },
      ).catch(() => {});
    }

    return rv.send(res, authView.loggedOut());
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Request password reset — sends email with reset link
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return rv.send(res, rv.badRequest('Email is required'));
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return 200 — never reveal whether the email exists
    if (!user) {
      return rv.send(res, rv.success({ message: 'If this account exists, a reset email has been sent.' }));
    }

    const token  = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3_600_000); // 1 hour

    user.resetPasswordToken  = token;
    user.resetPasswordExpiry = expiry;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendForgotPasswordEmail(user.email, user.firstName, resetUrl);

    logger.info(`Forgot-password requested for: ${email}`);
    return rv.send(res, rv.success({ message: 'If this account exists, a reset email has been sent.' }));
  } catch (error) {
    logger.error(`Forgot-password error: ${error.message}`);
    return rv.send(res, rv.serverError('Server error'));
  }
};

/**
 * @desc    Reset password using token from email
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return rv.send(res, rv.badRequest('Token and password are required'));
    }
    if (password.length < 8) {
      return rv.send(res, rv.badRequest('Password must be at least 8 characters'));
    }

    // Find user by token — select hidden fields needed for validation
    const user = await User.findOne({
      resetPasswordToken:  token,
      resetPasswordExpiry: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpiry');

    if (!user) {
      return rv.send(res, rv.badRequest('الرابط غير صالح أو منتهي الصلاحية'));
    }

    // Hash the password explicitly here, then write directly with updateOne.
    // This avoids any Mongoose dirty-tracking or validation issue that could
    // occur when the password field was not included in the original select.
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.updateOne(
      { _id: user._id },
      {
        $set:   { password: hashedPassword },
        $unset: { resetPasswordToken: '', resetPasswordExpiry: '' },
      }
    );

    await sendPasswordChangedEmail(user.email, user.firstName);

    logger.info(`Password reset successful for: ${user.email}`);
    return rv.send(res, authView.passwordReset());
  } catch (error) {
    logger.error(`Reset-password error: ${error.message}`);
    return rv.send(res, rv.serverError('Server error'));
  }
};
