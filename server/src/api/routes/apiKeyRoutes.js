
const express = require('express');
const {
  createApiKey,
  getApiKeys,
  getApiKey,
  updateApiKey,
  deleteApiKey,
  revokeApiKey,
  grantAllPermissions
} = require('../controllers/apiKeyController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .post(createApiKey)
  .get(getApiKeys);

router.route('/:id')
  .get(getApiKey)
  .put(updateApiKey)
  .delete(deleteApiKey);

router.route('/:id/revoke')
  .put(revokeApiKey);

router.route('/:id/permissions')
  .patch(grantAllPermissions);

module.exports = router;
