import express from 'express';
import { getProjects, createProject, deleteProject } from '../controllers/workspace';
const router = express.Router();

router.route('/dashboard').get(getProjects);
router.route('/projects').post(createProject).delete(deleteProject);

export default router;
