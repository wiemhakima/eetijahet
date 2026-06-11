const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/ratingController');

router.post('/',                  protect, ctrl.createRating);
router.get('/my-ratings',         protect, ctrl.getMyRatings);
router.get('/order/:deliveryId',  protect, ctrl.getOrderRating);

module.exports = router;
