/**
 * Parcel Routes — JWT + admin role required
 *
 * PATCH /api/v1/parcels/:id/status  — Update parcel status (+ GPS coords)
 */
const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { updateParcelStatus } = require('../controllers/parcelController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.patch('/:id/status', updateParcelStatus);

module.exports = router;
