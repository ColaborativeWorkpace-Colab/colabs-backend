import express from 'express';
import { parseValidationError } from '../middleware/errorMiddleware';
import userValidators from '../validators/userValidators';
import {
  authUser,
  deleteUser,
  getUserById,
  getUserProfile,
  getUsers,
  registerUser,
  updateUserOther,
  updateUserSelf,
  authWithGoogle,
  authWithGoogleCallback,
  authWithGoogleRedirect,
  verifyEmail,
  authWithGithub,
  authWithGithubRedirect,
  authWithGithubCallback,
  forgotPassword,
} from '../controllers/user';
import { admin, protect } from '../middleware/authMiddleware';
const router = express.Router();

router.route('/').post(userValidators.registerUser, parseValidationError, registerUser).get(protect, admin, getUsers);
router.route('/login').post(userValidators.loginUser, parseValidationError, authUser);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, userValidators.updateUser, parseValidationError, updateUserSelf);

router.route('/google').get(userValidators.socialRegisterUser, parseValidationError, authWithGoogle);
router.route('/google/callback').get(authWithGoogleCallback, authWithGoogleRedirect);
router.route('/github').get(userValidators.socialRegisterUser, parseValidationError, authWithGithub);
router.route('/github/callback').get(authWithGithubCallback, authWithGithubRedirect);
router.route('/signup/verify-email').get(verifyEmail);
router.route('/forgot-password').post(userValidators.forgotPassword, parseValidationError, forgotPassword);

// Admin routes
router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUserOther);

export default router;
