/**
 * Address Routes — JWT authenticated
 *
 * GET    /api/v1/addresses      — List favorite addresses
 * POST   /api/v1/addresses      — Create address
 * PUT    /api/v1/addresses/:id  — Update address
 * DELETE /api/v1/addresses/:id  — Delete address
 */
const express    = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} = require('../controllers/addressController');

const router = express.Router();

router.use(protect);

router.get('/',       getAddresses);
router.post('/',      createAddress);
router.put('/:id',    updateAddress);
router.delete('/:id', deleteAddress);

module.exports = router;
