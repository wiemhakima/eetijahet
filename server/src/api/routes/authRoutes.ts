// ============================================================
// AUTH ROUTES — TypeScript
// ============================================================
import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import {
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';

const router = Router();

// Public
router.post('/signup',                 signup);
router.post('/login',                  login);
router.post('/forgot-password',        forgotPassword);
router.post('/reset-password/:token',  resetPassword);

// Protected
router.get('/me',          protect, getMe);
router.put('/profile',     protect, updateProfile);
router.put('/password',    protect, changePassword);
router.post('/logout',     protect, logout);

export default router;
