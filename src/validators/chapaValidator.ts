import { body } from 'express-validator';

const chapaValidator = {
  init: [
    body('projectId').trim().isMongoId().withMessage('projectId should be valid mongodb Id'),
    body('earnings').trim().isNumeric().withMessage('earnings should be a number'),
    body('freelancerId').trim().isMongoId().withMessage('freelancerId should be valid mongodb Id'),
  ],

  addBankInfo: [
    body('bankCode').isString().trim().withMessage('bankCode is required and should be string'),
    body('accountNumber').isString().trim().withMessage('accountNumber is required and should be string'),
    body('accountName').isString().trim().withMessage('accountName is required and should be string'),
    body('businessName').isString().trim().withMessage('businessName is required and should be string'),
  ],
};

export default chapaValidator;
