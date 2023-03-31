import { Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { Freelancer, Repository, User } from '../models/';
import { Octokit } from 'octokit';
import * as fs from 'fs/promises';

// TODO: Add Permissions
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
  const { projectId } = req.params as { projectId: string };
  const { projectName } = req.body as { projectName: string };
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

/**
 * Upload files to project
 * @route GET /api/v1/workspaces
 * @access Private
 */
const uploadProjectFiles = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { projectName, commitMessage, workerId } = req.body as {
    projectName: string;
    commitMessage: string;
    workerId: string;
  };
  const client = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });
  const files = Array.from((req.files ?? []) as unknown[]);
  const worker = await Freelancer.findById(workerId);
  const project = await Repository.findById(projectId);

  let fileIterator = 0;
  const uploadedFiles: object[] = [];

  if (worker && project) {
    new Promise((resolve, reject) => {
      files.forEach(async (f) => {
        const file = JSON.parse(JSON.stringify(f));
        const content = await fs.readFile(file.path, { encoding: 'base64' });
        let fileSha = '';

        project.files.forEach((projectFile: any) => {
          if (projectFile.fileName === file.originalname) {
            fileSha = projectFile.sha;
            return;
          }
        });

        const uploadResponse = await client.request(
          `PUT /repos/${process.env.GITHUB_ORGANIZATION}/${projectName}/contents/${file.originalname}`,
          {
            message: commitMessage,
            committer: {
              name: `${worker.firstName} ${worker.lastName}`,
              email: worker.email,
            },
            sha: fileSha,
            content,
          },
        );

        if (uploadResponse) {
          fileIterator++;
          const fileReference = { fileName: uploadResponse.data.content.name, sha: uploadResponse.data.content.sha };
          let fileExists = false;

          project.files.forEach((projectFile: any) => {
            if (projectFile.fileName === fileReference.fileName) {
              fileExists = true;
              return;
            }
          });

          if (!fileExists) uploadedFiles.push(fileReference);

          if (fileIterator === files.length) resolve(true);
        } else reject('File Upload request failed');
      });
    })
      .then(async () => {
        const databaseFilesUpadted = await project.updateOne({ files: [...project.files, ...uploadedFiles] });

        if (databaseFilesUpadted) {
          res.json({
            message: `Files are uploaded successfully.`,
          });
          return;
        } else {
          res.status(500);
          throw new Error('Failed to store file references in database');
        }
      })
      .catch((error) => {
        res.status(500);
        throw new Error(error);
      });
  } else {
    res.status(404);
    throw new Error(worker ? 'Project not found' : 'User not found');
  }
});

/**
 * Delete files from project
 * @route GET /api/v1/workspaces
 * @access Private
 */
const deleteProjectFiles = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { projectName, files, workerId, commitMessage } = req.body as {
    projectName: string;
    files: string;
    workerId: string;
    commitMessage: string;
  };
  const client = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });
  const worker = await Freelancer.findById(workerId);
  const project = await Repository.findById(projectId);
  const filesToBeDeleted = files.split(',');

  let fileSha = '';
  let fileIterator = 0;

  if (worker && project) {
    new Promise((resolve, reject) => {
      filesToBeDeleted.forEach(async (fileName) => {
        project.files.forEach((projectFile: any) => {
          if (projectFile.fileName === fileName) {
            fileSha = projectFile.sha;
            return;
          }
        });

        const deleteResponse = await client.request(
          `DELETE /repos/${process.env.GITHUB_ORGANIZATION}/${projectName}/contents/${fileName}`,
          {
            message: commitMessage,
            committer: {
              name: `${worker.firstName} ${worker.lastName}`,
              email: worker.email,
            },
            sha: fileSha,
          },
        );

        if (deleteResponse) {
          fileIterator++;
          if (fileIterator === filesToBeDeleted.length) resolve(true);
        } else reject('File Upload request failed');
      });
    })
      .then(async () => {
        const unremovedFiles: string[] = [];
        project.files.forEach((file: any) => {
          if (!filesToBeDeleted.includes(file.fileName)) unremovedFiles.push(file);
        });

        const databaseFilesUpadted = await project.updateOne({ files: unremovedFiles });

        if (databaseFilesUpadted) {
          res.json({
            message: `Files are deleted successfully.`,
          });
          return;
        } else {
          res.status(500);
          throw new Error('Failed to delete file references in database');
        }
      })
      .catch((error) => {
        res.status(500);
        throw new Error(error);
      });
  } else {
    res.status(404);
    throw new Error(worker ? 'Project not found' : 'User not found');
  }
});

export { getProjects, createProject, deleteProject, uploadProjectFiles, deleteProjectFiles };
