import express from 'express';
import {
  addTeamMembers,
  applyJob,
  completeJob,
  deleteJob,
  downloadJobResultPackage,
  getJobsSelf,
  jobReady,
  getJobDetail,
  postJob,
  getJobsPublic,
  applicationApprove,
  getAllApplications,
  getApplication,
  getAllApplicationsSelf,
} from '../controllers/jobs';
import jobValidation from '../validators/jobValidator';
import { parseValidationError } from '../middleware/errorMiddleware';
import { protect } from '../middleware/authMiddleware';
const router = express.Router();

router.route('/').get(getJobsPublic).post(jobValidation.createJob, parseValidationError, protect, postJob);
router.route('/self').get(protect, getJobsSelf);
router.route('/detail/:jobId').get(getJobDetail);

// Actions on a single job
router.route('/apply/:jobId').post(jobValidation.applyToJob, parseValidationError, protect, applyJob);
router.route('/addMembers/:jobId').put(jobValidation.team, parseValidationError, protect, addTeamMembers);
router.route('/ready/:jobId').put(jobReady);
router.route('/complete/:jobId').put(completeJob);
router.route('/delete/:jobId').delete(deleteJob);

router.route('/download').get(downloadJobResultPackage);

// applications
router
  .route('/applications/list/:jobId')
  .get(jobValidation.getAllApplication, parseValidationError, protect, getAllApplications);
router.route('/applications/self').get(protect, getAllApplicationsSelf);
router
  .route('/applications/:applicationId')
  .get(jobValidation.signleApplication, parseValidationError, protect, getApplication)
  .put(jobValidation.applicationApprove, parseValidationError, protect, applicationApprove);

export default router;
