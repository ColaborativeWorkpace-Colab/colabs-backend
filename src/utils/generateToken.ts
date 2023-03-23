import { jwtSecret } from '../config';
import jwt from 'jsonwebtoken';

/**
 * Generate a json web token for a user
 * @param id The id of the user
 */
const generateToken = (id: string) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: '30d',
  });
};

export default generateToken;
