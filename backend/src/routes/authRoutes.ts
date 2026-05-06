import { Router } from 'express';
import {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
  searchUsers,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import { signupValidation, loginValidation } from '../middleware/validation';
import { asyncHandler } from '../utils/response';

const router = Router();

// Public routes
router.post('/signup', signupValidation, handleValidationErrors, asyncHandler(signup));
router.post('/login', loginValidation, handleValidationErrors, asyncHandler(login));

// Protected routes
router.get('/profile', authenticate, asyncHandler(getProfile));
router.put('/profile', authenticate, asyncHandler(updateProfile));
router.post('/change-password', authenticate, asyncHandler(changePassword));
router.get('/users/search', authenticate, asyncHandler(searchUsers));

export default router;
