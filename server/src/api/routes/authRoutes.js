
const express = require('express');
const { signup, login, getMe, logout, updateProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// TEST ONLY - Create test client
router.post('/create-test-client', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const User = require('../../models/User');

  // Check if already exists
  const existing = await User.findOne({ email: 'test@test.com' });
  if (existing) {
    return res.json({
      message: 'Test client already exists',
      email: 'test@test.com',
      password: 'test123'
    });
  }

  const hashedPassword = await bcrypt.hash('test123', 12);

  const client = await User.create({
    firstName: 'Test',
    lastName: 'Client',
    email: 'test@test.com',
    phone: '+216 55 000 000',
    password: hashedPassword,
    role: 'user',
    agency: null,
    isActive: true
  });

  res.json({
    message: 'Test client created!',
    email: 'test@test.com',
    password: 'test123',
    id: client._id
  });
});

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;
