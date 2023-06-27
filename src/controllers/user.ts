import { NextFunction, Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { Employer, Freelancer, User, Request as RequestModel, Job, Project, JobApplication, Payment } from '../models/';
import generateToken from '../utils/generateToken';
import passport from 'passport';
import { appEmail, backendURL, frontendURL, jwtSecret, transport } from '../config';
import { forgotPasswordFormat, verifyEmailFormat } from '../utils/mailFormats';
import Token from '../models/Token';
import jwt, { Secret } from 'jsonwebtoken';
import httpStatus from 'http-status';
import { Decoded, JobApplicationStatus, LegalInfo, PaymentStatus, TokenTypes } from '../types';
import { UserDiscriminators, findTypeofUser } from '../utils/finder';
import { RequestStatus, RequestType } from '../types/request';
import { ProjectStatus } from '../types/project';
import Chapa from 'chapa-node';
import { chapaKey } from '../config/envVars';

const chapa = new Chapa(chapaKey);

/**
 * Authenticate user and get token
 * @route POST /api/users/login
 * @access Public
 */
const authUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.authUser(password, email);

  res.send({
    message: 'Signin Successfully.',
    data: user,
    token: generateToken(user._id),
  });
});

/**
 * Register a new user
 * @route POST /api/users
 * @access Public
 */
const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
  const { type, isMobile } = req.query as { type: UserDiscriminators; isMobile: string };
  const TargetUser = findTypeofUser(type);
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }
  const user = new TargetUser({
    firstName,
    lastName,
    email,
    password,
  });

  if (user) {
    if (isMobile === 'true') {
      res.json({ user, token: generateToken(user._id) });
    } else {
      const emailToken = await Token.create({
        token: generateToken(`${user._id}-${user.email}`, '1d'),
        expires: '1d',
        user: user._id,
        type: TokenTypes.EMAIL_VERIFY,
      });
      const link = `${backendURL}/api/v1/users/signup/verify-email/?type=${type}&token=${emailToken.token}`;
      await transport.sendMail({
        from: appEmail as string,
        to: user.email,
        html: verifyEmailFormat(link),
        subject: 'Verify your email',
      });
      await user.save();
      res.send({
        message: 'We have sent you verification email. Please verify your email',
      });
    }
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
  const userId = req.user?._id;
  const user = await User.findById(userId).select('-password');

  if (user) {
    res.json({
      user,
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
const updateUserSelf = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { firstName, lastName, email, password, skills, bio, occupation, imageUrl } = req.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    skills?: string[];
    bio?: string;
    occupation?: string;
    imageUrl?: string;
  };

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (firstName) {
    user.firstName = firstName;
  }
  if (lastName) {
    user.lastName = lastName;
  }
  if (email) {
    const exitUser = await User.findOne({ email });
    if (exitUser && exitUser._id.toString() !== userId?.toString()) {
      res.status(400);
      throw new Error('User already exists with this email');
    }
    user.email = email;
  }
  if (password) {
    user.password = password;
  }
  if (skills) {
    user.skills = skills;
  }
  if (bio) {
    user.bio = bio;
  }
  if (occupation) {
    user.occupation = occupation;
  }

  if (imageUrl) {
    user.imageUrl = imageUrl;
  }

  await user.save();
  res.send({
    message: 'User updated successfully',
    user,
  });
});

/**
 * Get all users
 * @route GET /api/users
 * @access Private/Admin
 */
const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const freelancers = await Freelancer.find({});
  const employers = await Employer.find({});

  // TODO: Add pagination and caching
  res.json({
    users: [...freelancers, ...employers],
  });
});

/**
 * Delete a user
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id, type } = req.params as { id: string; type: UserDiscriminators };
  const TargetUser = findTypeofUser(type);
  const user = await TargetUser.findById(id);
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
  const { id, type } = req.params as { id: string; type: UserDiscriminators };
  const TargetUser = findTypeofUser(type);
  const user = await TargetUser.findById(id);

  if (user) {
    res.json({ user: user.cleanUser() });
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
const updateUserOther = asyncHandler(async (req: Request, res: Response) => {
  const { id, type } = req.params as { id: string; type: UserDiscriminators };
  const TargetUser = findTypeofUser(type);
  const user = await TargetUser.findById(id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.password = req.body.password || user.password;
    await user.save();
    res.send({
      message: 'User updated successfully',
      user: user.cleanUser(),
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
  return passport.authenticate('google', {
    state: JSON.stringify(req.query),
  })(req, res, next);
});

/**
 * Authenticate user with Google callback
 * @route GET /api/users/google/callback
 * @access Public
 */
const authWithGoogleCallback = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  return passport.authenticate(
    'google',
    {
      session: false,
      failureRedirect: '/login',
    },
    (err: Error, user: any) => {
      if (err) next(err);
      req.user = user;
      next();
    },
  )(req, res, next);
});

/**
 * Redirect user with access-toke
 * @route GET /api/users/google/callback
 * @access Public
 */
const authWithGoogleRedirect = asyncHandler(async (req: Request, res: Response) => {
  res.cookie('access-token', req.user?.token); // todo change this to match frontend
  res.redirect(`${frontendURL}/verification-success/?type=${req.user?.type}&token=${req.user?.token}`);
});

/**
 * Redirect mobile user with access-token
 * @route GET /api/users/google/mobile/callback
 * @access Public
 */
const authWithGoogleMobileRedirect = asyncHandler(async (req: Request, res: Response) => {
  res.json({ token: req.user?.token });
});

/**
 * Redirect user with access-toke
 * @route GET /api/users/signup/verify-me
 * @access Public
 */
const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token, type } = req.query as { token: string; type: UserDiscriminators };
  const secret: Secret = jwtSecret;
  const decodedData = jwt.verify(token as string, secret) as unknown as Decoded;
  const tokenExist = await Token.findOne({
    user: decodedData.id.split('-')[0],
  });
  if (!tokenExist) {
    res.status(httpStatus.NOT_FOUND).send({
      message: 'Token not found',
    });
  } else {
    const TargetUser = findTypeofUser(type);
    const user = await TargetUser.findOne({
      email: decodedData.id.split('-')[1],
    });
    if (!user) {
      res.send({
        message: 'No user found with this email',
      });
    } else {
      await Token.findOneAndDelete({
        user: decodedData.id.split('-')[0],
      });
      user.emailVerified = true;
      await user.save();
      const accessToken = await Token.create({
        user: user._id,
        token: generateToken(user._id),
        type: TokenTypes.ACCESS,
        expires: '30d',
      }); // todo change this to match frontend
      res.redirect(`${frontendURL}/verification-success/?type=${type}&token=${accessToken.token}`);
    }
  }
});

/**
 * Authenticate user with Github
 * @route GET /api/users/github
 * @access Public
 */
const authWithGithub = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  return passport.authenticate('github', {
    state: JSON.stringify(req.query),
  })(req, res, next);
});

/**
 * Authenticate user with Github callback
 * @route GET /api/users/Github/callback
 * @access Public
 */
const authWithGithubCallback = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  return passport.authenticate(
    'github',
    {
      session: false,
      failureRedirect: '/login',
    },
    (err: Error, user: any) => {
      if (err) next(err);
      req.user = user;
      next();
    },
  )(req, res, next);
});

/**
 * Redirect user with access-toke
 * @route GET /api/users/Github/callback
 * @access Public
 */
const authWithGithubRedirect = asyncHandler(async (req: Request, res: Response) => {
  res.cookie('access-token', req.user?.token); // todo change this to match frontend
  res.redirect(`${frontendURL}/verification-success/?type=${req.user?.type}&token=${req.user?.token}`);
});

/**
 * Forgot password
 * @route POST /api/users/forgot-password
 * @access Public
 */
const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const { type } = req.query as { type: UserDiscriminators };
  const TargetUser = findTypeofUser(type);
  const user = await TargetUser.findOne({ email });
  if (!user) res.status(httpStatus.NOT_FOUND).send({ message: 'User not found' });
  else {
    const token = generateToken(user._id);
    const link = `${backendURL}/reset-password/?token=${token}`;
    await transport.sendMail({
      from: appEmail,
      to: email,
      subject: 'Password Reset',
      html: forgotPasswordFormat(link),
    });
    res.send({
      message: 'Password reset link sent to your email',
    });
  }
});

/**
 * Request account verification
 * @route POST /api/users/request
 * @access Public
 */
const submitRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { legalInfo, type } = req.body as { legalInfo: LegalInfo; type: RequestType };

  const newRequest = await RequestModel.create({
    user: userId,
    legalInfo,
    status: RequestStatus.INREVIEW,
    type,
  });

  if (newRequest) {
    res.status(httpStatus.CREATED).send({
      message: 'Request created successfully',
    });
    return;
  }
  throw new Error('Failed to submit the reques.');
});

/**
 * Get all pending requests
 * @route POST /api/users/request
 * @access Private/Admin
 */
const getAllRequestOthers = asyncHandler(async (_req: Request, res: Response) => {
  // TODO: add pagination
  const requests = await RequestModel.find({ status: RequestStatus.INREVIEW }).populate('user');
  res.status(httpStatus.OK).send({ requests });
});

/**
 * Get all my requests
 * @route POST /api/users/request
 * @access Private
 */
const getAllRequestSelf = asyncHandler(async (_req: Request, res: Response) => {
  // TODO: add pagination
  const requests = await RequestModel.find({ user: _req.user?._id });
  res.status(httpStatus.OK).send({ requests });
});

/**
 * Get request by id
 * @route get /api/users/request/:id
 * @access Private/Admin
 */
const getRequestByIdOthers = asyncHandler(async (_req: Request, res: Response) => {
  const { id } = _req.params;
  const request = await RequestModel.findById(id);
  if (!request) res.status(httpStatus.NOT_FOUND).send({ message: 'Request not found' });
  res.status(httpStatus.OK).send({ request });
});

/**
 * Get request by id
 * @route get /api/users/request/:id
 * @access Private/Admin
 */
const getRequestByIdSelf = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const request = await RequestModel.findOne({ user: req.user?._id, _id: id });
  if (!request) res.status(httpStatus.NOT_FOUND).send({ message: 'Request not found' });
  res.status(httpStatus.OK).send({ request });
});

/**
 * Get request by id
 * @route get /api/users/request/:id
 * @access Private/Admin
 */
const deleteRequestByIdSelf = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existRequest = await RequestModel.findOne({ user: req.user?._id, _id: id });
  if (!existRequest) res.status(httpStatus.NOT_FOUND).send({ message: 'Request not found' });
  await RequestModel.deleteOne({ user: req.user?._id, _id: id });
  res.status(httpStatus.OK).send({ message: 'Request deleted successfully' });
});

/**
 * Update request status
 * @route PUT /api/users/request/:id
 * @access Private/Admin
 * @param {string} id - request id
 */
const updateRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.query as { action: RequestStatus.APPROVED | RequestStatus.REJECTED };
  const request = await RequestModel.findById(id).populate('user');
  if (!request) res.status(httpStatus.NOT_FOUND).send({ message: 'Request not found' });
  else {
    if (request?.status !== RequestStatus.INREVIEW) {
      res.status(httpStatus.BAD_REQUEST);
      throw new Error('Request already approved or rejected');
    }
    const user = await User.findById(request.user._id);
    if (!user) {
      res.status(httpStatus.NOT_FOUND);
      throw new Error('User not found');
    }

    if (action === RequestStatus.APPROVED) {
      user.isVerified = true;
      if (request.legalInfo) {
        user.legalInfo = {
          ...user.legalInfo,
          ...request.legalInfo,
        };
      }
      if (user.baseModelName === 'Freelancer' && user.subAccountId === undefined && user.legalInfo.bank) {
        const subAccountId = await chapa.createSubAccount({
          split_type: 'percentage',
          split_value: 0.5, // todo update me later
          business_name: request.legalInfo.bank.businessName,
          bank_code: request.legalInfo.bank.bankCode,
          account_number: request.legalInfo.bank.accountNumber,
          account_name: request.legalInfo.bank.accountName,
        });
        user.subAccountId = subAccountId as string;
      }

      await user.save();

      request.status = action;
      await request.save();
      res.send({
        message: 'Request verfied successfully.',
      });
    }

    if (action === RequestStatus.REJECTED) {
      request.status = action;
      await request.save();
      res.send({
        message: 'Request reject.',
      });
    }
  }
});

// dashboard

/**
 * Dahsbord for client
 * @route Get /api/users/dashboard
 * @access Private / Client
 */
const dashboardClient = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  if (user?.type !== 'Employer') {
    throw new Error('Please login as a client');
  }

  const jobs = await Job.find({ owner: user?._id });
  const hiredWorkers = await JobApplication.aggregate([
    {
      $match: {
        employerId: user._id,
        status: JobApplicationStatus.Accepted,
      },
    },
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job',
      },
    },
    {
      $unwind: {
        path: '$job',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'workerId',
        foreignField: '_id',
        as: 'worker',
      },
    },
    {
      $unwind: {
        path: '$worker',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        worker: {
          _id: '$worker._id',
          firstName: '$worker.firstName',
          lastName: '$worker.lastName',
          email: '$worker.email',
          imageUrl: '$worker.imageUrl',
        },
        earnings: '$job.earnings',
      },
    },
  ]);

  const projects = await Project.find({ owner: user?._id }).populate('members.workerId');
  const totalSpent = await Payment.aggregate([
    {
      $match: {
        employerId: user._id,
        status: PaymentStatus.PAID,
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: '$amount',
        },
      },
    },
  ]);
  res.send({
    message: 'Dashboard for client',
    jobs,
    hiredWorkers,
    projects,
    totalSpent: totalSpent[0]?.total || 0,
  });
});

/**
 * Dahsbord for freelancer
 * @route Get /api/users/dashboard
 * @access Private / Freelancer
 */
const dashboardFreelancer = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  if (user?.type !== 'Freelancer') {
    throw new Error('Please login as a freelancer');
  }

  const totalApplied = await JobApplication.count({
    workerId: user?._id,
  });

  const totalHired = await JobApplication.count({
    workerId: user?._id,
    status: JobApplicationStatus.Accepted,
  });

  // find active and completed freelancer projects
  const projects = await Project.aggregate([
    {
      $match: {
        'members.workerId': user._id,
      },
    },
    {
      $facet: {
        active: [
          {
            $match: {
              status: ProjectStatus.ONGOING,
            },
          },
          {
            $project: {
              _id: '$_id',
              title: '$title',
              description: '$description',
              status: '$status',
              startDate: '$startDate',
              endDate: '$endDate',
              owner: '$owner',
              members: '$members',
            },
          },
        ],
        completed: [
          {
            $match: {
              status: ProjectStatus.COMPLETED,
            },
          },
          {
            $project: {
              _id: '$_id',
              title: '$title',
              description: '$description',
              status: '$status',
              startDate: '$startDate',
              endDate: '$endDate',
              owner: '$owner',
              members: '$members',
            },
          },
        ],
      },
    },
  ]);
  const totalGained = await Payment.aggregate([
    {
      $match: {
        freelancerId: user._id,
        status: PaymentStatus.PAID,
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: '$amount',
        },
      },
    },
  ]);

  res.send({
    message: 'Dashboard for freelancer',
    totalApplied,
    totalHired,
    activeProjects: projects[0].active,
    completedProjects: projects[0].completed,
    totalGained: totalGained[0]?.total || 0,
  });
  return;
});

export {
  authUser,
  getUserProfile,
  registerUser,
  updateUserSelf,
  getUsers,
  deleteUser,
  getUserById,
  updateUserOther,
  authWithGoogle,
  authWithGoogleCallback,
  authWithGoogleMobileRedirect,
  authWithGoogleRedirect,
  verifyEmail,
  authWithGithub,
  authWithGithubCallback,
  authWithGithubRedirect,
  forgotPassword,
  submitRequest,
  getAllRequestOthers,
  updateRequest,
  getRequestByIdOthers,
  getAllRequestSelf,
  getRequestByIdSelf,
  deleteRequestByIdSelf,
  dashboardClient,
  dashboardFreelancer,
};
