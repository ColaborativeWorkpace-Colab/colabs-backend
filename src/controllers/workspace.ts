import { Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { Repository, User } from '../models/';
import { Octokit } from 'octokit';
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
  const client = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });
  let errorMessage = 'User not found';

  if (user) {
    errorMessage = 'Project Creation Failed';
    // TODO: replace variables with actual values
    const repoResponse = await client.request(`POST /orgs/${process.env.GITHUB_ORGANIZATION}/repos`, {
      name: projectName,
      homepage: 'https://github.com',
      private: true,
    });

    if (repoResponse.status === 201) {
      const repository = await Repository.create({ name: projectName, owner: userId });

      if (repository) {
        res.json({
          message: `${projectName} is successfully created.`,
        });
        return;
      }
    }
  }
  res.status(404);
  throw new Error(errorMessage);
});

/**
 * Delete Project
 * @route GET /api/v1/workspaces
 * @access Private
 */
const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, projectName } = req.body as { projectId: string; projectName: string };
  const client = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });

  const repoResponse = await client.request(`DELETE /repos/${process.env.GITHUB_ORGANIZATION}/${projectName}`);
  let errorMessage = 'Failed Request';

  if (repoResponse.status === 204) {
    errorMessage = 'Project not found';
    const project = await Repository.findByIdAndDelete(projectId);

    if (project) {
      res.json({
        message: `${project.name} is successfully deleted.`,
      });
      return;
    }
  }

  res.status(404);
  throw new Error(errorMessage);
});

export { getProjects, createProject, deleteProject };
