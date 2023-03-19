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
  updateUser,
  updateUserProfile,
  authWithGoogle,
  authWithGoogleCallback,
  authWithGoogleRedirect,
} from '../controllers/user';
import { admin, protect } from '../middleware/authMiddleware';
const router = express.Router();

router.route('/').post(userValidators.registerUser, parseValidationError, registerUser).get(protect, admin, getUsers);
router.route('/login').post(userValidators.loginUser, parseValidationError, authUser);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, userValidators.updateUser, parseValidationError, updateUserProfile);

router.route('/google').get(authWithGoogle);
router.route('/google/callback').get(authWithGoogleCallback, authWithGoogleRedirect);
router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

export default router;
