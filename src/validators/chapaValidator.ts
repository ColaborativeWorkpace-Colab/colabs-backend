import { body } from 'express-validator';

const chapaValidator = {
  init: [
    body('firstName').isString().trim().withMessage('firstName is required and should be string'),
    body('lastName').isString().trim().withMessage('lastName is required and should be string'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('amount').isString().withMessage('Amount is required an should be string'),
  ],

  addBankInfo: [
    body('bankCode').isString().trim().withMessage('bankCode is required and should be string'),
    body('accountNumber').isString().trim().withMessage('accountNumber is required and should be string'),
    body('accountName').isString().trim().withMessage('accountName is required and should be string'),
    body('businessName').isString().trim().withMessage('businessName is required and should be string'),
  ],
};

export default chapaValidator;
