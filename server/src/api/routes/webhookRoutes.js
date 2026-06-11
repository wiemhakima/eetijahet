const express            = require('express');
const webhookController  = require('../controllers/webhookController');

const router = express.Router();

router.post('/armada', webhookController.handleArmadaWebhook);

module.exports = router;
