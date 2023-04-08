import express from 'express';
import { getMessages } from '../controllers/messaging';
const router = express.Router();

router.route('/:userId').get(getMessages);
export default router;
