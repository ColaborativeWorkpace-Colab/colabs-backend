import { body, param } from 'express-validator';
import { JobApplicationStatus } from '../types';

const jobValidation = {
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

  getAllApplication: [body('jobId').not().isEmpty().isMongoId().withMessage('jobId is required')],
  team: [
    param('jobId').not().isEmpty().isMongoId().withMessage('JobId param is required'),
    body('team').not().isEmpty().isArray().withMessage('team is required to have atleast one element in the array'),
  ],
};

export default jobValidation;
