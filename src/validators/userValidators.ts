import { body } from 'express-validator';

const userValidators = {
  registerUser: [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  updateUser: [
    body('name', 'Name should be string').optional().isString().trim(),
    body('email', 'Please include a valid email').optional().isEmail(),
    body('password', 'Please enter a password with 6 or more characters').optional().isLength({ min: 6 }),
  ],
  loginUser: [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
  ],
};

export default userValidators;
