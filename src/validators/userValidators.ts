import { body, query } from 'express-validator';

const userValidators = {
  registerUser: [
    query('type', 'User type is incorrect or missign').isIn(['freelancer', 'employer']).not().isEmpty(),
    body('firstName', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  socialRegisterUser: [
    query('type', 'User type is incorrect or missign').isIn(['freelancer', 'employer']).not().isEmpty(),
  ],
  updateUser: [
    body('fistName', 'Name should be string').optional().isString().trim(),
    body('email', 'Please include a valid email').optional().isEmail(),
    body('password', 'Please enter a password with 6 or more characters').optional().isLength({ min: 6 }),
  ],
  loginUser: [
    query('type', 'User type is incorrect or missign').isIn(['freelancer', 'employer']).not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
  ],
};

export default userValidators;
