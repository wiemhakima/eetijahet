/**
 * Agency Settings Controller
 * Handles profile, delivery zones, working hours, notifications, team management
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const Agency = require('../../models/Agency');
const User = require('../../models/User');
const emailService = require('../../services/emailService');
const logger = require('../../utils/logger');
const rv = require('../../views/responseView');
const agencyView = require('../../views/agencyView');

// ── Get all agency settings ────────────────────────────────────────────────────
exports.getSettings = async (req, res, next) => {
  try {
    const agency = await Agency.findById(req.user.agency)
      .populate('team.user', 'firstName lastName email phone avatar lastLogin')
      .populate('team.addedBy', 'firstName lastName');

    if (!agency) {
      return rv.send(res, agencyView.notFound('Agency not found'));
    }

    return rv.send(res, agencyView.settings({ agency }));
  } catch (err) {
    next(err);
  }
};

// ── Update agency profile ──────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, logo, description, address, phone, email, website, socialMedia } = req.body;

    const agency = await Agency.findByIdAndUpdate(
      req.user.agency,
      {
        'profile.name':        name,
        'profile.logo':        logo,
        'profile.description': description,
        'profile.address':     address,
        'profile.phone':       phone,
        'profile.email':       email,
        'profile.website':     website,
        'profile.socialMedia': socialMedia,
      },
      { new: true, runValidators: true }
    );

    return rv.send(res, agencyView.settingsSaved({ success: true, agency }));
  } catch (err) {
    next(err);
  }
};

// ── Update delivery zones ──────────────────────────────────────────────────────
exports.updateDeliveryZones = async (req, res, next) => {
  try {
    const { deliveryZones, defaultPricing } = req.body;

    const agency = await Agency.findByIdAndUpdate(
      req.user.agency,
      { deliveryZones, defaultPricing },
      { new: true, runValidators: true }
    );

    return rv.send(res, agencyView.settingsSaved({ success: true, deliveryZones: agency.deliveryZones, defaultPricing: agency.defaultPricing }));
  } catch (err) {
    next(err);
  }
};

// ── Update working hours ───────────────────────────────────────────────────────
exports.updateWorkingHours = async (req, res, next) => {
  try {
    const { is24_7, schedule, holidays } = req.body;

    const agency = await Agency.findByIdAndUpdate(
      req.user.agency,
      {
        'workingHours.is24_7':    is24_7,
        'workingHours.schedule':  schedule,
        'workingHours.holidays':  holidays,
      },
      { new: true }
    );

    return rv.send(res, agencyView.settingsSaved({ success: true, workingHours: agency.workingHours }));
  } catch (err) {
    next(err);
  }
};

// ── Update notification settings ───────────────────────────────────────────────
exports.updateNotifications = async (req, res, next) => {
  try {
    const { email, sms } = req.body;

    const agency = await Agency.findByIdAndUpdate(
      req.user.agency,
      {
        'notifications.email': email,
        'notifications.sms':   sms,
      },
      { new: true }
    );

    return rv.send(res, agencyView.settingsSaved({ success: true, notifications: agency.notifications }));
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// TEAM MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

// ── Get team ───────────────────────────────────────────────────────────────────
exports.getTeam = async (req, res, next) => {
  try {
    const agency = await Agency.findById(req.user.agency)
      .populate('team.user', 'firstName lastName email phone avatar lastLogin')
      .populate('team.addedBy', 'firstName lastName');

    return rv.send(res, agencyView.settings({ team: agency.team || [] }));
  } catch (err) {
    next(err);
  }
};

// ── Invite team member ─────────────────────────────────────────────────────────
exports.inviteTeamMember = async (req, res) => {
  try {
    const { email, firstName, lastName, phone, role, permissions } = req.body;

    if (!email || !firstName) {
      return rv.send(res, agencyView.badRequest('Email and first name are required'));
    }

    // req.agency is populated by resolveTenant — guaranteed to be the correct agency
    const agency = req.agency;
    if (!agency) {
      return rv.send(res, agencyView.badRequest('Agency not found'));
    }

    // Always generate a fresh password (plain — User model pre-save hook hashes it)
    const generatedPassword = crypto.randomBytes(4).toString('hex') + '!Kw9';

    let user = await User.findOne({ email: email.toLowerCase() });

    const assignedRole = role === 'admin' ? 'agency_admin' : 'gestionnaire_agency';

    if (user) {
      // Existing user — check if already in team
      const alreadyInTeam = agency.team.some(t => t.user.toString() === user._id.toString());
      if (alreadyInTeam) {
        return rv.send(res, agencyView.badRequest('This user is already in your team'));
      }
      user.password = generatedPassword;
      user.role     = assignedRole;
      user.agency   = agency._id;
      await user.save();
    } else {
      user = await User.create({
        firstName,
        lastName: lastName || '',
        email:    email.toLowerCase(),
        phone:    phone || '',
        password: generatedPassword,
        role:     assignedRole,
        agency:   agency._id,
      });
    }

    // Send welcome email with credentials (non-blocking)
    emailService.sendGestionnaireWelcome({
      email,
      firstName: firstName || user.firstName,
      agencyName: agency.name,
      password: generatedPassword,
    }).catch(err => logger.error(`Welcome email failed: ${err.message}`));

    const defaultPermissions = {
      merchants:  true,
      drivers:    true,
      deliveries: true,
      statistics: true,
      finances:   true,
      settings:   role === 'admin',
      team:       role === 'admin',
    };

    const updatedAgency = await Agency.findByIdAndUpdate(
      agency._id,
      {
        $push: {
          team: {
            user:        user._id,
            role:        role || 'manager',
            permissions: permissions || defaultPermissions,
            addedBy:     req.user._id,
          },
        },
      },
      { new: true }
    ).populate('team.user', 'firstName lastName email avatar');

    return rv.send(res, rv.created({
      message: 'Team member invited successfully',
      team:    updatedAgency.team,
    }));
  } catch (err) {
    console.error('❌❌❌ TEAM INVITE CRASHED ❌❌❌');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    return rv.send(res, rv.serverError(err.message));
  }
};

// ── Update team member role / permissions ──────────────────────────────────────
exports.updateTeamMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { role, permissions } = req.body;

    const agency = await Agency.findOneAndUpdate(
      { _id: req.user.agency, 'team.user': memberId },
      {
        $set: {
          'team.$.role':        role,
          'team.$.permissions': permissions,
        },
      },
      { new: true }
    ).populate('team.user', 'firstName lastName email avatar');

    if (!agency) {
      return rv.send(res, agencyView.notFound('Team member not found'));
    }

    return rv.send(res, agencyView.settingsSaved({ success: true, team: agency.team }));
  } catch (err) {
    next(err);
  }
};

// ── Remove team member ─────────────────────────────────────────────────────────
exports.removeTeamMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    if (memberId === req.user._id.toString()) {
      return rv.send(res, agencyView.badRequest("You can't remove yourself from the team"));
    }

    // FIX 1 — Invalid ObjectId: clean null/corrupt entries and return
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      await Agency.findByIdAndUpdate(
        req.user.agency,
        { $pull: { team: { user: null } } }
      );
      return rv.send(res, rv.success({ message: 'Invalid member removed' }));
    }

    // FIX 2 — Cast to ObjectId so $pull matches the stored BSON type
    await Agency.findByIdAndUpdate(
      req.user.agency,
      { $pull: { team: { user: new mongoose.Types.ObjectId(memberId) } } }
    );

    // FIX 3 — Also sweep any remaining null/invalid team entries
    await Agency.findByIdAndUpdate(
      req.user.agency,
      { $pull: { team: { user: null } } }
    );

    return rv.send(res, rv.success({ message: 'Team member removed' }));
  } catch (err) {
    next(err);
  }
};
