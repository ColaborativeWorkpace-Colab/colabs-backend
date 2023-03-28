import { Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { Job, Freelancer, Notification, Employeer } from '../models';
// TODO: When manipulating a job info, only the owner has access
// Note: A job has four statuses: Pending, Completed, Active, Ready, Available
import { Octokit } from 'octokit';
import { getFilesfromRepo } from '../utils/download';
// TODO: Record Notifications for necessary endpoints
// NOTE: When manipulating a job info, only the owner has access
// NOTE: A job has five statuses: Pending, Completed, Active, Ready, Available
/**
 * Get Jobs
 * @route GET /api/v1/jobs
 * @access Public
 */
const getJobs = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.query as { userId: string };
  const jobs = await Job.find({ status: 'Available' });
  const user = await Freelancer.findById(userId);

  if (user) {
    res.json({
      jobs,
      skills: user.skills,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * Post Job
 * @route GET /api/v1/jobs
 * @access Priviledged, Public
 */
const postJob = asyncHandler(async (req: Request, res: Response) => {
  const { recruiterId, title, description, requirements, earnings } = req.body as {
    recruiterId: string;
    title: string;
    description: string;
    requirements: string;
    earnings: number;
  };
  const user = await Employeer.findById(recruiterId);
  let errorMessage = 'User not found';
  if (user) {
    errorMessage =
      'Your account does not yet have access to this feature. Complete your profile verification to proceed.';

    if (user.isRecruiterVerified) {
      errorMessage = 'Job Posting Failed';
      const job = await Job.create({
        title,
        description,
        earnings,
        requirements: requirements.split(','),
        owner: recruiterId,
      });

      if (job) {
        res.json({
          message: `The ${title} job is successfully posted.`,
        });
        return;
      }
    }
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

    if (job.status === 'Available' || job.status === 'Pending' || job.status === 'Completed') {
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
  // TODO: Send a notification for both worker and recruiter (job status changes to 'Ready')
  // TODO: Only provide the job file assets to the recruiter when payment is completed
  // TODO: Add payment
  // TODO: Implement upgrade points and update user profile
  const job = await Job.findByIdAndUpdate(jobId, { status: 'Completed' });
  if (job) {
    res.json({
      message: `You have completed ${job?.title} successfully.`,
    });
  } else {
    res.status(404);
    throw new Error('Job not found');
  }
});

/**
 * Apply for Job
 * @route GET /api/v1/jobs
 * @access Private
 */
const applyJob = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params as { jobId: string };
  const { workerIds } = req.body as { workerIds: string };

  // TODO: Verify user is leigible for work
  // TODO: If job has SVT's and user do not have the skills in their profile, first send those
  const job = await Job.findByIdAndUpdate(jobId, { workers: workerIds.split(','), status: 'Active' });

  if (job) {
    res.json({
      message: `${job?.title} applied successfully.`,
    });
  } else {
    res.status(404);
    throw new Error('Job not found');
  }
});

/**
 * Add team members
 * @route GET /api/v1/jobs
 * @access Private
 */
const addTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params as { jobId: string };
  const { team } = req.body as { team: string };
  const teamMembers: string[] = team.split(',');
  const job = await Job.findByIdAndUpdate(jobId, { workers: teamMembers });
  // TODO: Get Previous members from client
  // TODO: Notify previous members
  if (job) {
    res.json({
      message: `You have added new members to the job.`,
    });
  } else {
    res.status(404);
    throw new Error('Job not found');
  }
});

/**
 * Job Ready
 * @route GET /api/v1/jobs
 * @access Private
 */
const jobReady = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params as { jobId: string; workerId: string; recruiterId: string };
  const job = await Job.findByIdAndUpdate(jobId, { status: 'Ready' });
  let errorMessage = 'Job not found';

  if (job) {
    // TODO: Notify owner of the job state change
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
    // TODO: Package all files into a compressed zip file
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

export { getJobs, postJob, deleteJob, completeJob, applyJob, addTeamMembers, jobReady, downloadJobResultPackage };
