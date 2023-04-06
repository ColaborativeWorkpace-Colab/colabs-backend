import express from 'express';
import { getPosts, likePost, postContent, commentPost, editPost } from '../controllers/social';

const router = express.Router();

router.route('/:userId').get(getPosts).post(postContent);

router.route('/:userId/:postId/like').put(likePost);
router.route('/:userId/:postId/comment').put(commentPost);
router.route('/:userId/:postId/edit').put(editPost);

export default router;
