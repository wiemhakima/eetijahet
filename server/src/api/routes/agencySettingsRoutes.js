/**
 * Agency Settings Routes
 * All mounted under /agencies/me — e.g. GET /api/agencies/me/settings
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { resolveTenant, requireAgencyAdmin } = require('../middlewares/tenantMiddleware');
const ctrl = require('../controllers/agencySettingsController');
const Agency = require('../../models/Agency');

// ── Permission helper ──────────────────────────────────────────────────────────
const checkPermission = (permission) => async (req, res, next) => {
  try {
    const agency = await Agency.findById(req.user.agency).select('owner team');
    if (!agency) return res.status(404).json({ error: 'Agency not found' });

    // Owner always has full access
    if (agency.owner?.toString() === req.user._id.toString()) return next();

    const member = agency.team.find(t => t.user.toString() === req.user._id.toString());
    if (member?.permissions?.[permission]) return next();

    return res.status(403).json({ error: `You don't have permission: ${permission}` });
  } catch (err) {
    next(err);
  }
};

// Apply auth + tenant to all routes
router.use(protect, resolveTenant, requireAgencyAdmin);

// ── Settings overview ──────────────────────────────────────────────────────────
router.get('/settings', ctrl.getSettings);

// ── Profile ────────────────────────────────────────────────────────────────────
router.put('/settings/profile', checkPermission('settings'), ctrl.updateProfile);

// ── Delivery zones ─────────────────────────────────────────────────────────────
router.get('/settings/zones', ctrl.getSettings);
router.put('/settings/zones', checkPermission('settings'), ctrl.updateDeliveryZones);

// ── Working hours ──────────────────────────────────────────────────────────────
router.put('/settings/hours', checkPermission('settings'), ctrl.updateWorkingHours);

// ── Notifications ──────────────────────────────────────────────────────────────
router.put('/settings/notifications', checkPermission('settings'), ctrl.updateNotifications);

// ── Team management ────────────────────────────────────────────────────────────
router.get(   '/settings/team',            checkPermission('team'), ctrl.getTeam);
router.post(  '/settings/team',            checkPermission('team'), ctrl.inviteTeamMember);
router.put(   '/settings/team/:memberId',  checkPermission('team'), ctrl.updateTeamMember);
router.delete('/settings/team/:memberId',  checkPermission('team'), ctrl.removeTeamMember);

module.exports = router;
