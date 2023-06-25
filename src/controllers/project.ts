import { Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { CREATED, FORBIDDEN, OK } from 'http-status';
import Project from '../models/Project';
import { IWorkerInfo, ProjectStatus } from 'src/types/project';
import { Octokit } from 'octokit';
import { Repository } from '../models';

/**
 * Create new project
 * @route POST /api/project
 * @access Private Employer
 */
const addProject = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const { title, members } = req.body as {
    title: string;
    members: IWorkerInfo[];
  };

  try {
    if (user?.type !== 'Employer') {
      res.status(FORBIDDEN).send({
        message: 'You need client account to create project',
      });
      return;
    }
    const projectValidName = title.replace(/\s/g, '-');
    const project = await Project.create({
      title: projectValidName,
      owner: user?._id,
      members,
    });
    const client = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    if (project) {
      const repoResponse = await client.request(`POST /orgs/${process.env.GITHUB_ORGANIZATION}/repos`, {
        name: projectValidName,
        homepage: 'https://github.com',
        private: true,
      });

      if (repoResponse.status === 201) {
        const repo = await Repository.create({ name: projectValidName, owner: user._id });
        project.repositoryId = repo._id;

        res.status(CREATED).send({
          message: 'Project created successfully.',
          data: project,
        });
        return;
      }
    }
  } catch (error) {
    throw new Error(error);
  }
});

/**
 * Create new project
 * @route POST /api/project/:id
 * @access Private Employer
 */
const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params as {
    id: string;
  };
  const { title, members, status } = req.body as {
    title: string;
    members: IWorkerInfo[];
    status: ProjectStatus;
  };

  const project = await Project.findById(id);

  if (project) {
    if (user?._id?.toString() !== project?.owner.toString()) {
      res.status(FORBIDDEN).send({
        message: 'You are not the owner of this project',
      });
      return;
    }
    if (title) {
      const projectValidName = title.replace(/\s/g, '-');
      project.title = projectValidName;
    }
    if (members) {
      project.members = [...members];
    }
    if (status) {
      project.status = status;
    }
    await project.save();

    res.status(OK).send({
      message: 'Project updated successfully.',
      data: project,
    });
    return;
  } else {
    res.status(FORBIDDEN).send({
      message: 'Project not found',
    });
    return;
  }
});

/**
 * dall project
 * @route POST /api/project
 * @access Private Employer
 */
const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (user?.type !== 'Employer') {
    res.status(FORBIDDEN).send({
      message: 'You need client account to create project',
    });
    return;
  }

  const projects = await Project.find({
    owner: user._id,
  });

  res.status(CREATED).send({
    message: 'Projects fetched successfully.',
    data: projects,
  });
  return;
});

/**
 * detail project
 * @route POST /api/project/:id
 * @access Private Employer
 */
const projectDetail = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params as {
    id: string;
  };
  if (user?.type !== 'Employer') {
    res.status(FORBIDDEN).send({
      message: 'You need client account to create project',
    });
    return;
  }

  const projects = await Project.findById(id).populate('members.workerId');

  res.status(CREATED).send({
    message: 'Projects fetched successfully.',
    data: projects,
  });
  return;
});

/**
 * detail project
 * @route POST /api/project/:id
 * @access Private Employer
 */
const requestPayment = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params as {
    id: string;
  };
  if (user?.type !== 'Freelancer') {
    res.status(FORBIDDEN).send({
      message: 'You need freelancer account to create project',
    });
    return;
  }

  const project = await Project.findById(id);
  if (!project) throw new Error('Project not found');
  const updatedMembers = project.members.map((member) => {
    if (member.workerId.toString() === user?._id?.toString()) {
      return {
        ...member,
        paymentRequested: true,
      };
    }
    return member;
  });
  project.members = [...updatedMembers];

  await project.save();
  res.status(OK).send({
    message: 'Payment requested successfully.',
  });
  return;
});

/**
 * get project freelancer
 * @route POST /api/project/freelancer
 * @access Private Employer
 */
const getProjectsFreelancer = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (user?.type !== 'Freelancer') {
    res.status(FORBIDDEN).send({
      message: 'You need freelancer account to create project',
    });
    return;
  }

  const projects = await Project.aggregate([
    {
      $match: {
        'members.workerId': user._id,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'members.workerId',
        foreignField: '_id',
        as: 'teams',
      },
    },
    {
      $addFields: {
        self: {
          $filter: {
            input: '$members',
            as: 'member',
            cond: {
              $eq: ['$$member.workerId', user._id],
            },
          },
        },
      },
    },

    {
      $project: {
        _id: 1,
        title: 1,
        status: 1,
        teams: 1,
        self: { $first: '$self' },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  res.status(OK).send({
    message: 'Freelancer projects fetched successfully.',
    data: projects,
  });
  return;
});

export { addProject, updateProject, getProjects, projectDetail, getProjectsFreelancer, requestPayment };
