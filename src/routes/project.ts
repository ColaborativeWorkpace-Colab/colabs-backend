import express from 'express';
import { addProject, getProjects, projectDetail, requestPayment, updateProject } from '../controllers/project';
import projectValidator from '../validators/projectValidator';
import { parseValidationError } from '../middleware/errorMiddleware';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router
  .route('/')
  .get(protect, getProjects)
  .post(projectValidator.addProject, parseValidationError, protect, addProject);
router.route('/:id').get(protect, projectDetail).put(protect, updateProject);
router.route('/request-payment/:id').get(protect, requestPayment);

export default router;
