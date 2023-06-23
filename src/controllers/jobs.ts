import { Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { Job, JobApplication, Notification, Employer, User } from '../models';
import { Octokit } from 'octokit';
import { getFilesfromRepo } from '../utils/download';
import { JobApplicationStatus, JobStatus } from '../types';
import { appEmail, frontendURL, transport } from '../config';
import { acceptJobApplicationFormat, rejectJobApplicationFormat } from '../utils/mailFormats';
import { Types } from 'mongoose';

// NOTE: When manipulating a job info, only the owner has accessPending, Completed, Active, Ready, Available
/**
 * Get Jobs self
 * @route GET /api/v1/jobs/self
 * @access Private
 */
const getJobsSelf = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const jobs = await Job.find({ $or: [{ status: JobStatus.Available }, { status: JobStatus.Pending }], owner: userId });

  // todo add pagination
  res.json({
    jobs,
  });
});

/**
 * Get Jobs public (for freelancers)
 * @route GET /api/v1/jobs
 * @access Public
 */
const getJobsPublic = asyncHandler(async (req: Request, res: Response) => {
  const searchQuery = req.query as unknown as {
    status: JobStatus;
    earnings: number;
    start: number;
    limit: number;
    order: 'asc' | 'desc';
    paymentVerified: boolean;
  };

  const data = await Job.aggregate([
    {
      $facet: {
        jobs: [
          {
            $match: {
              status: searchQuery.status || JobStatus.Pending,
              earnings: { $gte: Number(searchQuery.earnings) || 0 },
              paymentVerified: { $eq: !!searchQuery.paymentVerified },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
            },
          },
          {
            $unwind: {
              path: '$owner',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              title: 1,
              description: 1,
              earnings: 1,
              requirements: 1,
              paymentVerified: 1,
              pendingworkers: 1,
              createdAt: 1,
              owner: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                imageUrl: 1,
              },
            },
          },

          {
            $sort: {
              createdAt: searchQuery.order === 'asc' ? 1 : -1,
            },
          },
          {
            $skip: Number(searchQuery.start * searchQuery.limit) || 0,
          },
          {
            $limit: Number(searchQuery.limit) || 10,
          },
        ],

        total: [
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const total = data[0].total[0].count;
  const hasNextPage = total > Number(searchQuery.start * searchQuery.limit) + Number(searchQuery.limit);

  res.json({
    data: data[0].jobs,
    filters: {
      ...searchQuery,
    },
    hasNextPage,
    total,
  });
});

/**
 * Get Job Detail
 * @route GET /api/v1/jobs/detail/:jobId
 * @access Public
 */
const getJobDetail = asyncHandler(async (_req: Request, res: Response) => {
  const jobId = _req.params.jobId;
  const job = await Job.findById(jobId);
  const applications = await JobApplication.find({ jobId }).populate('workerId').populate('jobId');
  if (job) {
    res.json({
      job,
      applications,
    });
  } else {
    res.status(404);
    throw new Error('Job not found');
  }
});

/**
 * Post Job
 * @route GET /api/v1/jobs
 * @access Priviledged, Public
 */
const postJob = asyncHandler(async (req: Request, res: Response) => {
  const recruiterId = req.user?._id;
  const { title, description, requirements, earnings } = req.body as {
    recruiterId: string;
    title: string;
    description: string;
    requirements: string[];
    earnings: number;
  };

  const employer = await Employer.findById(recruiterId);
  let errorMessage = 'User not found or not an employer';
  if (employer) {
    // errorMessage =
    //   'Your account does not yet have access to this feature. Complete your profile verification to proceed.';

    // if (employer.isVerified) {
    errorMessage = 'Job Posting Failed';
    const job = await Job.create({
      title,
      description,
      earnings,
      requirements,
      owner: recruiterId,
    });

    if (job) {
      res.json({
        message: `The ${title} job is successfully posted.`,
      });
      return;
    }
    // }
  }

  res.status(404);
  throw new Error(errorMessage);
});

/**
 * Delete Job
 * @route GET /api/v1/jobs
 * @access Private
 */
const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.query as { jobId: string };
  let errorMessage = 'Job not found';
  const job = await Job.findById(jobId);

  if (job) {
    errorMessage = 'Job is currently being worked on';

    if (job.status === JobStatus.Available || job.status === JobStatus.Pending || job.status === JobStatus.Completed) {
      res.json({
        message: `${job?.title} is successfully deleted.`,
      });
      return;
    }
  }
  res.status(404);
  throw new Error(errorMessage);
});

/**
 * Complete Job
 * @route GET /api/v1/jobs
 * @access Private
 */
const completeJob = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params as { jobId: string };
  // TODO: Only provide the job file assets to the recruiter when payment is completed
  // TODO: Add payment
  // TODO: Implement upgrade points and update user profile
  const job = await Job.findByIdAndUpdate(jobId, { status: JobStatus.Completed });
  let errorMessage = 'Job not found';

  if (job) {
    errorMessage = 'Notification Request Failed';

    const pendingNotifications = job.workers.map((worker: string) => {
      return {
        title: `${job.title} Completed`,
        message: `Congratulations!! You have completed the ${job.title} job.`,
        userId: worker,
      };
    });

    const notification = await Notification.insertMany(pendingNotifications);

    if (notification) {
      res.json({
        message: `${job?.title} completed successfully.`,
      });
      return;
    }
  } else {
    res.status(404);
    throw new Error(errorMessage);
  }
});

/**
 * Apply for Job
 * @route PUT /api/v1/jobs/apply/:jobId
 * @access Private
 */
const applyJob = asyncHandler(async (req: Request, res: Response) => {
  const workerId = req.user?._id;
  const { jobId } = req.params as { jobId: string };
  const { coverLetter } = req.body as {
    coverLetter: string;
  };
  const job = await Job.findById(jobId);
  const worker = await User.findById(workerId);
  let errorMessage = worker ? 'User is not verified for jobs' : 'User not found';
  if (!job) errorMessage = 'Job not found.';
  let statusCode = worker ? 403 : 404;

  const alreadyApplied = await JobApplication.findOne({
    jobId: job?._id,
    workerId: worker?._id,
  });
  if (job?.owner.toString() === workerId?.toString()) throw new Error('You can`t apply to your own job');
  if (alreadyApplied) throw new Error('Already applied for this job');

  // ? Note removed need for freelancer to be verifie to apply for job
  if (worker) {
    const jobApplication = await JobApplication.create({
      workerId,
      jobId,
      employerId: job?.owner,
      coverLetter,
    });

    errorMessage = 'Failed to submit job proposal';
    statusCode = 500;

    if (jobApplication) {
      const job = await Job.findByIdAndUpdate(jobId, { status: 'Pending', $push: { pendingworkers: workerId } });
      const jobApplicationNotification = {
        title: `Your job has new application`,
        message: `${worker?.firstName} has applied to your job.`,
        userId: worker,
      };

      await Notification.create(jobApplicationNotification);
      if (job) {
        res.json({
          message: 'Your proposal has been sent and is pending for approval',
        });

        return;
      }
    }
  }

  res.status(statusCode);
  res.json({
    message: errorMessage,
  });
});

/**
 * Add team members
 * @route GET /api/v1/jobs
 * @access Private
 */
const addTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params as { jobId: string };
  const { team } = req.body as { team: string[] };
  const job = await Job.findById(jobId);
  const jobOwner = await User.findById(job?.owner);
  let errorMessage = 'Job not found';

  if (job) {
    const workers = [...job.workers, ...team];
    const newMembersAdded = await Job.findByIdAndUpdate(jobId, { workers });
    errorMessage = 'Failed to add new members.';

    if (newMembersAdded) {
      errorMessage = 'Notification Request Failed';

      const pendingNotifications = workers.map((worker) => {
        return {
          title: `Joined a job team`,
          message: `${jobOwner?.firstName} has added you to work on their job as a team.`,
          userId: worker,
        };
      });

      const notification = await Notification.insertMany(pendingNotifications);

      if (notification) {
        res.json({
          message: `You have added new members to the job.`,
        });
        return;
      }
    }
  }

  res.status(404);
  throw new Error(errorMessage);
});

/**
 * Job Ready
 * @route PUT /api/v1/jobs/:jobId/ready
 * @access Private
 */
const jobReady = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params as { jobId: string };
  const { projectShas } = req.body as { projectShas: string };
  const projects = projectShas.split(',');
  const job = await Job.findByIdAndUpdate(jobId, { status: JobStatus.Ready, filesReady: projects });

  let errorMessage = 'Job not found';

  if (job) {
    const notification = await Notification.create({
      title: 'Files Ready',
      message: `Your workers are ready with the files on the ${job.title} job.`,
      userId: job.owner,
    });
    errorMessage = 'Notification Request Failed';

    if (notification) {
      res.json({
        message: `The job is ready to be viewed by the owner.`,
      });
    }
  } else {
    res.status(404);
    throw new Error(errorMessage);
  }
});

// TODO: Approve job proposal done by the recruiter

/**
 * Download and provide the result files the worker has been tasked to do.
 * @route GET /api/v1/jobs
 * @access Private
 */
const downloadJobResultPackage = asyncHandler(async (req: Request, res: Response) => {
  const { projectName, files } = req.body as { projectName: string; files: string };
  const client = new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  });

  const projectRootURL = `GET /repos/${process.env.GITHUB_ORGANIZATION}/${projectName}/contents`;
  const repoResponse = await client.request(projectRootURL);
  const selectedFiles: string[] = files.split(',');

  if (repoResponse) {
    const downloadUrls: any[] = [];
    repoResponse.data.forEach((value: any) => {
      if (selectedFiles.includes(value.name)) {
        downloadUrls.push({ name: value.name, download_url: value.download_url });
      }
    });

    // TODO: Test
    const { downloadFileName, data } = await getFilesfromRepo(projectName, downloadUrls);
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename=${downloadFileName}`);
    res.set('Content-Length', data.length);
    res.send(data);
  } else {
    res.status(404);
    throw new Error('File Package not found');
  }
});

// applications

/**
 * Get all job applications
 * @route GET /api/v1/jobs/applications
 * @access Private
 */
const getAllApplications = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params as { jobId: string };
  const { start, limit } = req.query as unknown as { start: number; limit: number };

  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found.');

  const applications = await JobApplication.aggregate([
    {
      $facet: {
        applications: [
          {
            $match: {
              jobId: new Types.ObjectId(jobId),
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
              _id: 1,
              coverLetter: 1,
              status: 1,
              job: {
                title: 1,
                description: 1,
                earnings: 1,
                requirements: 1,
                paymentVerified: 1,
                createdAt: 1,
              },
              worker: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                imageUrl: 1,
              },
            },
          },
          {
            $skip: Number(start * limit) || 0,
          },
          {
            $limit: Number(limit) || 10,
          },

          {
            $sort: {
              createdAt: -1,
            },
          },
        ],
        total: [
          {
            $match: {
              jobId: new Types.ObjectId(jobId),
            },
          },
          {
            $group: {
              _id: null,
              count: {
                $sum: 1,
              },
            },
          },
        ],
      },
    },
  ]);

  const data = applications[0].applications;
  const total = applications[0].total[0]?.count || 0;
  const hasNextPage = total > Number(start * limit) + Number(limit);

  res.send({
    data,
    total,
    hasNextPage,
  });
});

/**
 * Get all job applications self
 * @route GET /api/v1/jobs/applications
 * @access Private
 */
const getAllApplicationsSelf = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  const applications = await JobApplication.aggregate([
    {
      $match: {
        workerId: new Types.ObjectId(userId),
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
        localField: 'job.owner',
        foreignField: '_id',
        as: 'owner',
      },
    },
    {
      $unwind: {
        path: '$owner',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        coverLetter: 1,
        status: 1,
        job: {
          title: 1,
          description: 1,
          earnings: 1,
          requirements: 1,
          paymentVerified: 1,
          createdAt: 1,
        },
        owner: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          imageUrl: 1,
        },
      },
    },
  ]);

  res.send({
    applications,
  });
});

/**
 * Approve or reject job application
 * @route PUT /api/v1/jobs/applications/:applicationId
 * @access Private
 */
const applicationApprove = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { applicationId } = req.params as { applicationId: string };
  const { action } = req.body as { action: JobApplicationStatus };
  const jobApplication = await JobApplication.findById(applicationId).populate('workerId');
  const job = await Job.findById(jobApplication?.jobId);
  const worker = await User.findById(jobApplication?.workerId);

  let errorMessage = 'Error';
  if (!job) errorMessage = 'Job not found';
  if (!jobApplication) throw new Error('Job application not found');
  if (jobApplication.status !== JobApplicationStatus.Pending)
    throw new Error(`Job application already ${jobApplication.status}`);

  if (userId === (jobApplication.workerId as unknown as string)) {
    throw new Error(`You can't ${action} your own job`);
  }
  if (jobApplication && job) {
    if (action === JobApplicationStatus.Accepted) {
      jobApplication.status = JobApplicationStatus.Accepted;
      await jobApplication.save();
      // send email to job owner
      const link = `${frontendURL}/freelancer/jobs/${jobApplication.jobId}`;
      await transport.sendMail({
        to: worker?.email,
        from: appEmail,
        subject: 'Job application approved.',
        html: acceptJobApplicationFormat(job?.title, link),
      });

      res.send({
        message: 'Job application approved.',
      });
      return;
    }
    if (action === JobApplicationStatus.Rejected) {
      jobApplication.status = JobApplicationStatus.Rejected;
      // send email to job owner
      const link = `${frontendURL}/jobs/${jobApplication.jobId}`;
      await jobApplication.save();
      await transport.sendMail({
        to: worker?.email,
        from: appEmail,
        subject: 'Job application rejected.',
        html: rejectJobApplicationFormat(job?.title, link),
      });
      res.send({
        message: 'Job application rejected.',
      });
      return;
    }
    if (action === JobApplicationStatus.Cancelled) {
      if (userId === (jobApplication.workerId as unknown as string)) {
        jobApplication.status = JobApplicationStatus.Cancelled;
        await jobApplication.save();
        res.send({
          message: 'You canceled your job application.',
        });
        return;
      }
    }
  } else {
    res.status(404);
    throw new Error(errorMessage);
  }
});

/**
 * Get single application
 * @route get /api/v1/jobs/applications/:applicationId
 * @access Private
 */
const getApplication = asyncHandler(async (req: Request, res: Response) => {
  const { applicationId } = req.params as { applicationId: string };
  const application = await JobApplication.findById(applicationId).populate('workerId');

  if (!application) throw new Error('Job application not found');
  res.send({
    application,
  });
  return;
});

export {
  getJobsSelf,
  postJob,
  deleteJob,
  completeJob,
  applyJob,
  addTeamMembers,
  jobReady,
  downloadJobResultPackage,
  getJobDetail,
  getJobsPublic,
  applicationApprove,
  getAllApplications,
  getApplication,
  getAllApplicationsSelf,
};
