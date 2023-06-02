import express from 'express';
import chapaValidator from '../validators/chapaValidator';
import { initializePayment } from '../controllers/chapa';
import { protect } from '../middleware/authMiddleware';
import { parseValidationError } from '../middleware/errorMiddleware';

const route = express.Router();

route.post('/init', chapaValidator.init, parseValidationError, protect, initializePayment);

export default route;
