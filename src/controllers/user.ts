import { NextFunction, Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { User, Freelancer } from '../models/';
import generateToken from '../utils/generateToken';
import passport from 'passport';
import { IUser } from 'src/types';

/**
 * Authenticate user and get token
 * @route POST /api/users/login
 * @access Public
 */
const authUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.authUser(password, email);
  res.send(user);
});

/**
 * Register a new user
 * @route POST /api/users
 * @access Public
 */
const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password }: IUser = req.body;

  const userExists = await Freelancer.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await Freelancer.create({
    firstName,
    lastName,
    email,
    password,
  });

  if (user) {
    const cleaUser = await user.cleanUser();
    res.status(201).json({
      ...cleaUser,
      token: generateToken(user.id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id);

  if (user) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id);

  if (user) {
    user.firstName = req.body.name || user.firstName;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firsName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * Get all users
 * @route GET /api/users
 * @access Private/Admin
 */
const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find({});
  res.json(users);
});

/**
 * Delete a user
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const user = await User.findById(id);
  if (user) {
    await user.remove();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * Get a user by ID
 * @route GET /api/users/:id
 * @access Private/Admin
 */
const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = await User.findById(id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private/Admin
 */
const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = await User.findById(id);

  if (user) {
    user.firstName = req.body.name || user.firstName;
    user.isAdmin = req.body.isAdmin;
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      fristName: updatedUser.firstName,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * Authenticate user with Google
 * @route GET /api/users/google
 * @access Public
 */
const authWithGoogle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  return passport.authenticate('google', (error: any, user: any, _message: string) => {
    if (error || !user) {
      console.log('error', error);
      next(error);
    }
    req.user = user;
    next();
  })(req, res, next);
});

/**
 * Authenticate user with Google callback
 * @route GET /api/users/google/callback
 * @access Public
 */
const authWithGoogleCallback = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  return passport.authenticate('google', {
    session: false,
    failureRedirect: '/login',
  })(req, res, next);
});

/**
 * Redirect user with access-toke
 * @route GET /api/users/google/callback
 * @access Public
 */
const authWithGoogleRedirect = asyncHandler(async (req: Request, res: Response) => {
  res.cookie('access-token', req.user?.token);
  res.redirect('/');
});

export {
  authUser,
  getUserProfile,
  registerUser,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  authWithGoogle,
  authWithGoogleCallback,
  authWithGoogleRedirect,
};
