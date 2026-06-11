/**
 * Client routes — JWT required, role: 'user'
 */
const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getMyDeliveries,
  getDeliveryDetails,
  updateProfile,
  changePassword,
} = require('../controllers/clientController');

const router = express.Router();

router.use(protect);
router.use(authorize('user'));

router.get('/deliveries',        getMyDeliveries);
router.get('/deliveries/:id',    getDeliveryDetails);
router.put('/profile',           updateProfile);
router.put('/change-password',   changePassword);

module.exports = router;
