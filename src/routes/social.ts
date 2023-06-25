import express from 'express';
import {
  getPosts,
  likePost,
  postContent,
  commentPost,
  editPost,
  getUserSocialConnections,
  addUserSocialConnections,
  removeUserSocialConnections,
  getPostData,
  getDetail,
} from '../controllers/social';
import socialValidator from '../validators/socialValidator';
import { parseValidationError } from '../middleware/errorMiddleware';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(getPosts).post(socialValidator.create, parseValidationError, protect, postContent);
router.route('/:postId').get(getDetail);

// Post routes
router.route('/like/:postId').put(protect, likePost);
router.route('/comment/:postId').put(protect, commentPost);
router.route('/edit/:postId').put(editPost);

// Connection routes
router.route('/connections').get(protect, getUserSocialConnections);
router.route('/connections/addConnection').put(protect, addUserSocialConnections);
router.route('/connections/removeConnection').put(protect, removeUserSocialConnections);

// Explore Routes
router.route('/explore/:postTag').get(getPostData);

export default router;
