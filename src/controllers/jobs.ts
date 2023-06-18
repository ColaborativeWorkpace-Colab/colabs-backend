import { Request, Response } from '../types/express';
import asyncHandler from 'express-async-handler';
import { Job, JobApplication, Notification, Employer, User } from '../models';
import { Octokit } from 'octokit';
import { getFilesfromRepo } from '../utils/download';
import { JobApplicationStatus, JobStatus } from '../types';
import { appEmail, frontendURL, transport } from '../config';
import { acceptJobApplicationFormat, rejectJobApplicationFormat } from '../utils/mailFormats';

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
const getJobsPublic = asyncHandler(async (_req: Request, res: Response) => {
  const jobs = await Job.find({ $or: [{ status: JobStatus.Available }, { status: JobStatus.Pending }] });

  // todo add pagination
  res.json({
    jobs,
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

  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found.');

  const applications = await JobApplication.find({
    jobId,
  }).populate('workerId');

  res.send({
    message: 'List of applicants',
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
};
