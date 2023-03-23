import express from 'express';
import { getProjects, createProject } from '../controllers/workspace';
const router = express.Router();

router.route('/dashboard').get(getProjects);
router.route('/projects').post(createProject);

export default router;
