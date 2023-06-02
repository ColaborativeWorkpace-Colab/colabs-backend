import { body } from 'express-validator';

const chapaValidator = {
  init: [
    body('firstName').isString().trim().withMessage('firstName is required and should be string'),
    body('lastName').isString().trim().withMessage('lastName is required and should be string'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('amount').isString().withMessage('Amount is required an should be string'),
  ],
};

export default chapaValidator;
