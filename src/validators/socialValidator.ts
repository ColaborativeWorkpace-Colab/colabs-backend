import { body } from 'express-validator';

const socialValidator = {
  create: [body('textContent').not().isEmpty().withMessage('textContent is required')],
};

export default socialValidator;
