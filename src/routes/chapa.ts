import express from 'express';
import chapaValidator from '../validators/chapaValidator';
import { addBankAccountInfo, update, webHook, getAllBanks, initializePayment } from '../controllers/chapa';
import { protect } from '../middleware/authMiddleware';
import { parseValidationError } from '../middleware/errorMiddleware';

const route = express.Router();

route.post('/init', chapaValidator.init, parseValidationError, protect, initializePayment);
route.get('/update/:tnxRef', update);
route.post('/webhook', webHook);
route.put('/add-bank-info', chapaValidator.addBankInfo, parseValidationError, protect, addBankAccountInfo);
route.get('/banks', getAllBanks);

export default route;
