import { body, param } from 'express-validator';
import { JobApplicationStatus } from '../types/job_application';

const jobValidators = {
  postJob: [
    body('recruiterId').not().isEmpty().isString().trim().withMessage('The Recruiter Id is required'),
    body('title').isString().trim().withMessage('Job Title is required'),
    body('description').isString().withMessage('Job description is required'),
    body('requirements').isArray().withMessage('Password should be at least 6 characters long'),
    body('earnings').isNumeric().withMessage('Earnings is required'),
  ],
  deleteJob: [param('jobId').notEmpty().isString().trim().withMessage('Job Identifier is missing.')],
  completeJob: [param('jobId').notEmpty().isString().trim().withMessage('Job Identifier is missing.')],
  applyJob: [
    param('jobId').notEmpty().isString().trim().withMessage('Job Identifier is missing.'),
    body('workerId').notEmpty().isString().trim().withMessage('The Worker Id is required'),
    body('estimatedDeadline').isString().trim().withMessage('Provide an estimate deadline for job completion'),
    body('payRate').isString().withMessage('State your payrate'),
    body('coverLetter').isString().withMessage('Coverletter is required'),
    body('workBid').optional().isString().isIn(['By Milestone', 'By Project']).withMessage('Work bid is incorrect'),
  ],
  addTeamMembers: [
    param('jobId').notEmpty().isString().trim().withMessage('Job Identifier is missing.'),
    body('ownerName').isString().trim().withMessage('Owner name should be a string'),
    body('team').isString().withMessage('Mention your teammates'),
  ],
  jobReady: [
    param('jobId').notEmpty().isString().trim().withMessage('Job Identifier is missing.'),
    body('projectShas').isString().trim().withMessage('Project Shas are required'),
  ],
  approveJob: [
    param('jobApplicationId').notEmpty().isString().trim().withMessage('Job Application Identifier is missing.'),
  ],
  downloadJobResultPackage: [
    body('projectName').isString().trim().withMessage('Project Name is required'),
    body('files').isString().trim().withMessage('Files are required'),
  ],
  createJob: [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('description').not().isEmpty().withMessage('Description is required'),
    body('earnings').not().isEmpty().withMessage('Earnings is required'),
    body('requirements').isArray().withMessage('Requirements should be an array'),
  ],

  applyToJob: [
    param('jobId').not().isEmpty().isMongoId().withMessage('JobId param is required'),
    body('coverLetter').not().isEmpty().withMessage('CoverLetter is required'),
  ],
  applicationApprove: [
    param('applicationId').not().isEmpty().isMongoId().withMessage('ApplicationId param is required'),
    body('action')
      .isIn([JobApplicationStatus.Accepted, JobApplicationStatus.Rejected, JobApplicationStatus.Cancelled])
      .withMessage('Job Application actions is incorrect or missign'),
  ],

  singleApplication: [
    param('applicationId').not().isEmpty().isMongoId().withMessage('ApplicationId param is required'),
  ],

  getAllApplication: [param('jobId').not().isEmpty().isMongoId().withMessage('jobId is required')],
  team: [
    param('jobId').not().isEmpty().isMongoId().withMessage('JobId param is required'),
    body('team').not().isEmpty().isArray().withMessage('team is required to have atleast one element in the array'),
  ],
};

export default jobValidators;
