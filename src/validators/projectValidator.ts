import { body } from 'express-validator';

const projectValidator = {
  addProject: [
    body('members').not().isEmpty().withMessage('Members is required'),
    body('title').not().isEmpty().withMessage('Title is required'),
  ],
};

export default projectValidator;
