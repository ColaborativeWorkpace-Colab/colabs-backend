import { Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { Freelancer, Repository, Notification } from '../models/';
import { Octokit } from 'octokit';
import * as fs from 'fs/promises';
import { updatePermissions } from '../utils/updatePermissions';
import { TaskStatus } from 'src/types';

/**
 * Get Projects
 * @route GET /api/v1/workspaces/dashboard/:userId
 * @access Private
 */
const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params as { userId: string };
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
 * Get Project Files
 * @route GET /api/v1/workspaces/projects/:projectId
 * @access Private
 */
const getProjectFiles = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const repository = await Repository.findById(projectId);

  const client = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });

  if (repository) {
    const contents = await client.request(`GET /repos/${process.env.GITHUB_ORGANIZATION}/${repository.name}/contents`);
    const commits = await client.request(`GET /repos/${process.env.GITHUB_ORGANIZATION}/${repository.name}/commits`);
    const trees = await client.request(
      `GET /repos/${process.env.GITHUB_ORGANIZATION}/${repository.name}/git/trees/main`,
    );

    res.json({
      contents,
      commits,
      trees,
    });
  } else {
    res.status(404);
    throw new Error('Project not found');
  }
});

/**
 * Get Trees
 * @route GET /api/v1/workspaces/projects/:projectId/:sha
 * @access Private
 */
const getTrees = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, sha } = req.params as { projectId: string; sha: string };
  const repository = await Repository.findById(projectId);
  const client = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });

  if (repository) {
    const trees = await client.request(
      `GET /repos/${process.env.GITHUB_ORGANIZATION}/${repository.name}/git/trees/${sha}`,
    );

    res.json({
      trees,
    });
  } else {
    res.status(404);
    throw new Error('Project not found');
  }
});

/**
 * Get File Versions
 * @route GET /api/v1/workspaces/projects/:projectId/:fileRef
 * @access Private
 */
const getFileVersions = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, fileRef } = req.params as { projectId: string; fileRef: string };
  const repository = await Repository.findById(projectId);
  const client = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });

  if (repository) {
    const files = await client.request(
      `GET /repos/${process.env.GITHUB_ORGANIZATION}/${repository.name}/commits/${fileRef}`,
    );

    res.json({
      files,
    });
  } else {
    res.status(404);
    throw new Error('Project not found');
  }
});

/**
 * Create Project
 * @route POST /api/v1/workspaces/projects
 * @access Private (optional)
 */
const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { userId, projectName } = req.body as { userId: string; projectName: string };
  const user = await Freelancer.findById(userId);
  const client = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });
  let errorMessage = 'User not found';
  const projectValidName = projectName.replace(' ', '-');
  if (user) {
    errorMessage = 'Project Creation Failed';

    const repoResponse = await client.request(`POST /orgs/${process.env.GITHUB_ORGANIZATION}/repos`, {
      name: projectValidName,
      homepage: 'https://github.com',
      private: true,
    });

    if (repoResponse.status === 201) {
      const repository = await Repository.create({ name: projectValidName, owner: userId });

      if (repository) {
        const permissions = user.permissions;
        permissions.adminAccess.projects.push(repository.id);
        permissions.deleteFiles.projects.push(repository.id);
        permissions.uploadFiles.projects.push(repository.id);
        permissions.deleteProject.projects.push(repository.id);

        await user.updateOne({ permissions });

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
 * @route DELETE /api/v1/workspaces/projects/:projectId/delete
 * @access Private
 */
const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { projectName, workerId } = req.body as { projectName: string; workerId: string };
  const client = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });
  const worker = await Freelancer.findById(workerId);

  let errorMessage = 'User not found';
  let errorStatusCode = 404;

  if (worker) {
    errorMessage = 'You do not have access to delete this project.';
    errorStatusCode = 401;

    if (worker.permissions.deleteProject.projects.includes(projectId)) {
      const repoResponse = await client.request(`DELETE /repos/${process.env.GITHUB_ORGANIZATION}/${projectName}`);
      errorMessage = 'Failed Request';

      if (repoResponse.status === 204) {
        const project = await Repository.findByIdAndDelete(projectId);
        errorMessage = 'Project not found';

        if (project) {
          res.json({
            message: `${project.name} is successfully deleted.`,
          });
          return;
        }
      }
    }
  }

  res.status(errorStatusCode);
  throw new Error(errorMessage);
});

/**
 * Upload files to project
 * @route PUT /api/v1/workspaces/projects/:projectId/uploadFiles
 * @access Private
 */
const uploadProjectFiles = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { projectName, commitMessage, workerId } = req.body as {
    projectName: string;
    commitMessage: string;
    workerId: string;
  };
  console.log(req.files);
  const client = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });
  const files = Array.from((req.files ?? []) as unknown[]);
  const worker = await Freelancer.findById(workerId);
  const project = await Repository.findById(projectId);
  const uploadedFiles: object[] = [];

  let fileIterator = 0;

  if (worker && project) {
    // if (worker.permissions.uploadFiles.projects.includes(projectId)) {
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
        console.log(file.originalname);
        console.log(fileSha);
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
          let fileIndex = 0;

          project.files.forEach((projectFile: any, index: any) => {
            if (projectFile.fileName === fileReference.fileName) {
              fileExists = true;
              fileIndex = index;
              return;
            }
          });

          if (!fileExists) uploadedFiles.push(fileReference);
          else project.files[fileIndex] = fileReference;

          if (fileIterator === files.length) resolve(true);
        } else reject('File Upload request failed');
      });

      if (files.length === 0) reject('Files not uploaded');
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
        res.status(500).json({ error });
        throw new Error(error);
      })
      .finally(() => {
        files.forEach((f) => {
          const file = JSON.parse(JSON.stringify(f));
          fs.unlink(file.path);
        });
      });
    // } else {
    //  res.status(401);
    //  throw new Error('You do not have access to upload files to this project.');
    // }
  } else {
    res.status(404);
    throw new Error(worker ? 'Project not found' : 'User not found');
  }
});

/**
 * Delete files from project
 * @route PUT /api/v1/workspaces/projects/:projectId/removeFiles
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
    if (worker.permissions.uploadFiles.projects.includes(projectId)) {
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
      res.status(401);
      throw new Error('You do not have access to delete files to this project.');
    }
  } else {
    res.status(404);
    throw new Error(worker ? 'Project not found' : 'User not found');
  }
});

/**
 * Give permissions to other users for a given project
 * @route PUT /api/v1/workspaces/projects/:projectId/givePermission
 * @access Private
 */
const givePermissions = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { ownerId, memberId, permission } = req.body as { ownerId: string; memberId: string; permission: string };
  const owner = await Freelancer.findById(ownerId);
  const member = await Freelancer.findById(memberId);

  let errorMessage = 'Users not found';
  let statusCode = 404;

  if (owner && member) {
    errorMessage = 'You do not have access to delete files to this project.';
    statusCode = 401;

    if (owner.permissions.adminAccess.projects.includes(projectId)) {
      const memberPermissions = member.permissions;
      errorMessage = `Failed assigning permissions to ${member.firstName} ${member.lastName}`;
      statusCode = 500;

      updatePermissions(permission, projectId, memberPermissions);

      const dbRespnse = await member.updateOne({ permissions: memberPermissions });

      if (dbRespnse) {
        res.json({
          message: `${member.firstName} ${member.lastName} has acquired new permissions to this project.`,
        });

        return;
      }
    }
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Add tasks to projects
 * @route PUT /api/v1/workspaces/projects/:projectId/addTasks
 * @access Private
 */
const addTasks = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { newTask } = req.body as { newTask: string };
  const project = await Repository.findById(projectId);

  let errorMessage = 'Project not found';
  let statusCode = 404;

  if (project) {
    errorMessage = 'Failed to update project';
    statusCode = 500;

    const newTaskJSON = JSON.parse(JSON.stringify(newTask));
    const taskName = (newTaskJSON.title as string).replace(' ', '_');

    newTaskJSON.id = `${project.name}-${taskName}${newTaskJSON.deadline}`;
    const tasksUpdated = await project.updateOne({ tasks: [...project.tasks, newTaskJSON] });

    if (tasksUpdated) {
      res.json({
        message: 'Tasks added to the project',
      });

      return;
    }
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Edit project tasks
 * @route PUT /api/v1/workspaces/projects/:projectId/editTasks
 * @access Private
 */
const editTasks = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { editedTask } = req.body as { editedTask: string };
  const project = await Repository.findById(projectId);

  let errorMessage = 'Project not found';
  let statusCode = 404;

  if (project) {
    errorMessage = 'Failed to update project task';
    statusCode = 500;

    const editedTaskJSON = JSON.parse(JSON.stringify(editedTask));
    const editedTasks = project.tasks.map((task) => {
      if (task.id === editedTaskJSON.id) return editedTaskJSON;

      return task;
    });

    const tasksUpdated = await project.updateOne({ tasks: editedTasks });

    if (tasksUpdated) {
      res.json({
        message: 'Task edited',
      });

      return;
    }
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Delete project tasks
 * @route PUT /api/v1/workspaces/projects/:projectId/deleteTasks
 * @access Private
 */
const deleteTasks = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { taskId } = req.body as { taskId: string };
  const project = await Repository.findById(projectId);

  let errorMessage = 'Project not found';
  let statusCode = 404;

  if (project) {
    errorMessage = 'Task not found';
    statusCode = 404;

    let taskExists = false;

    project.tasks.forEach((task) => {
      if (task.id === taskId) taskExists = true;
    });

    if (taskExists) {
      errorMessage = 'Failed to remove project task';
      statusCode = 500;

      const updatedTasks = project.tasks.filter((task) => task.id !== taskId);
      const tasksUpdated = await project.updateOne({ tasks: updatedTasks });

      if (tasksUpdated) {
        res.json({
          message: 'Task removed',
        });

        return;
      }
    }
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Update task status
 * @route PUT /api/v1/workspaces/projects/:projectId/updateTaskStatus
 * @access Private
 */
const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { taskId, status } = req.body as { taskId: string; status: TaskStatus };
  const project = await Repository.findById(projectId);

  let errorMessage = 'Project not found';
  let statusCode = 404;

  if (project) {
    errorMessage = 'Failed to update project';
    statusCode = 500;

    const updatedTasks = project.tasks.map((task) => {
      if (task.id === taskId) {
        task.status = status;
        return task;
      } else return task;
    });
    const taskUpdated = await project.updateOne({ tasks: updatedTasks });

    if (taskUpdated) {
      res.json({
        message: 'Task status changed',
      });

      return;
    }
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Assign task to worker
 * @route PUT /api/v1/workspaces/projects/:projectId/assignTask
 * @access Private
 */
const assignTask = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { taskId, assignees } = req.body as { taskId: string; assignees: string };
  const project = await Repository.findById(projectId);

  let errorMessage = 'Project not found';
  let statusCode = 404;

  if (project) {
    errorMessage = 'Failed to assign task to users';
    statusCode = 500;

    const assigneesIds = assignees.split(',');
    const updatedAssignees = project.tasks.map((task) => {
      if (task.id === taskId) task.assignees = assigneesIds;

      return task;
    });
    const updatedTask = await project.updateOne({ tasks: updatedAssignees });

    if (updatedTask) {
      errorMessage = 'Notification Request Failed';

      const pendingNotifications = assigneesIds.map((assigneeId: string) => {
        return {
          title: `Task Assigned`,
          message: `A new task has been assigned to you in the ${project.name} workspace`,
          userId: assigneeId,
        };
      });

      const notification = await Notification.insertMany(pendingNotifications);

      if (notification) {
        res.json({ message: 'Task assigned' });
        return;
      }
    }
  }

  res.status(statusCode);
  throw new Error(errorMessage);
});

/**
 * Add members to project
 * @route PUT /api/v1/workspaces/projects/:projectId/addMembers
 * @access Private
 */
const addProjectMembers = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { workerIds } = req.body as { workerIds: string };
  const workers = workerIds.split(',');
  let errorMessage = 'Project not found';
  let statusCode = 404;
  let workerIterator = 0;
  const unverifiedWorkers: string[] = [];

  new Promise((resolve, _reject) => {
    workers.forEach((workerId) => {
      workerIterator++;
      Freelancer.findById(workerId).then((worker) => {
        if (worker && !worker.isVerified) unverifiedWorkers.push(workerId);
        if (workerIterator === workers.length) resolve(true);
      });
    });
  }).then(async () => {
    if (unverifiedWorkers.length === 0) {
      const project = await Repository.findById(projectId);

      if (project) {
        errorMessage = 'Failed to add members to project';
        statusCode = 500;

        const membersAdded = await project.updateOne({ $push: { members: [...workers] } });

        if (membersAdded) {
          res.json({
            message: 'Users added to project',
          });

          return;
        }
      }
    } else {
      res.status(403);
      res.json({
        message: 'There are users that are not verified for work yet. Make sure they are verified and try again.',
        unverifiedWorkers,
      });

      return;
    }

    res.status(statusCode);
    throw new Error(errorMessage);
  });
});

export {
  getProjects,
  createProject,
  deleteProject,
  uploadProjectFiles,
  deleteProjectFiles,
  givePermissions,
  getProjectFiles,
  getTrees,
  getFileVersions,
  addTasks,
  editTasks,
  deleteTasks,
  updateTaskStatus,
  assignTask,
  addProjectMembers,
};
