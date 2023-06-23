import { body } from 'express-validator';

const socialValidator = {
  create: [
    body('textContent').not().isEmpty().withMessage('textContent is required'),
    body('imageContent').not().isEmpty().withMessage('imageContent is required'),
    body('tags').not().isEmpty().withMessage('tags is required'),
  ],
};

export default socialValidator;
