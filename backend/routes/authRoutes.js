import express from 'express';
import {
  getProfile,
  updateProfile,
  getUserStats,
  signup,
  signin,
  signout
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/signup', signup);
router.post('/signin', signin);

// Protected routes (authentication required)
router.use(authenticateUser); // Apply auth middleware to all routes below

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/stats', getUserStats);
router.post('/signout', signout);

export default router;


