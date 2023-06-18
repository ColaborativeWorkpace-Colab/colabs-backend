"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobs_1 = require("../controllers/jobs");
const jobValidator_1 = __importDefault(require("../validators/jobValidator"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.route('/').get(jobs_1.getJobsPublic).post(jobValidator_1.default.createJob, errorMiddleware_1.parseValidationError, authMiddleware_1.protect, jobs_1.postJob);
router.route('/self').get(authMiddleware_1.protect, jobs_1.getJobsSelf);
router.route('/detail/:jobId').get(jobs_1.getJobDetail);
router.route('/apply/:jobId').post(jobValidator_1.default.applyToJob, errorMiddleware_1.parseValidationError, authMiddleware_1.protect, jobs_1.applyJob);
router.route('/addMembers/:jobId').put(jobValidator_1.default.team, errorMiddleware_1.parseValidationError, authMiddleware_1.protect, jobs_1.addTeamMembers);
router.route('/ready/:jobId').put(jobs_1.jobReady);
router.route('/complete/:jobId').put(jobs_1.completeJob);
router.route('/delete/:jobId').delete(jobs_1.deleteJob);
router.route('/download').get(jobs_1.downloadJobResultPackage);
router
    .route('/applications/list/:jobId')
    .get(jobValidator_1.default.getAllApplication, errorMiddleware_1.parseValidationError, authMiddleware_1.protect, jobs_1.getAllApplications);
router
    .route('/applications/:applicationId')
    .get(jobValidator_1.default.signleApplication, errorMiddleware_1.parseValidationError, authMiddleware_1.protect, jobs_1.getApplication)
    .put(jobValidator_1.default.applicationApprove, errorMiddleware_1.parseValidationError, authMiddleware_1.protect, jobs_1.applicationApprove);
exports.default = router;
//# sourceMappingURL=jobs.js.map