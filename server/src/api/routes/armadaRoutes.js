const express        = require('express');
const armadaController = require('../controllers/armadaController');
const authMiddleware   = require('../middlewares/authMiddleware');

const router = express.Router();

// Public — no token required
router.get('/sync',                                    armadaController.syncOrders);
router.post('/save',                                   armadaController.saveOrder);

// Protected — JWT required, order creation restricted to merchant role
router.post('/',           authMiddleware.protect, authMiddleware.authorize('merchant'), armadaController.createOrder);
router.get('/',             authMiddleware.protect,    armadaController.listOrders);
router.get('/:id',          authMiddleware.protect,    armadaController.getOrder);
router.patch('/:id/status', authMiddleware.protect,    armadaController.updateStatus);

module.exports = router;
