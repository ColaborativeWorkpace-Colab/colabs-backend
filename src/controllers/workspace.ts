import { Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { Repository, User } from '../models/';
/**
 * Get Projects
 * @route GET /api/v1/workspaces
 * @access Private
 */
const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.query as { userId: string };
  const repositories = await Repository.find({ owner: userId });

  if (repositories) {
    res.json({
      projects: repositories,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * Create Project
 * @route GET /api/v1/workspaces
 * @access Private (optional)
 */
const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { userId, projectName } = req.body as { userId: string; projectName: string };
  const user = await User.findById(userId);
  let errorMessage = 'User not found';

  if (user) {
    errorMessage = 'Project Creation Failed';
    const repository = await Repository.create({ name: projectName, owner: userId });

    if (repository) {
      res.json({
        message: `${projectName} is successfully created.`,
      });
      return;
    }
  }
  res.status(404);
  throw new Error(errorMessage);
});

export { getProjects, createProject };
