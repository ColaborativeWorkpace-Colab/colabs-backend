import express from 'express';
import { fileUploadMulter } from '../utils/upload';
import {
  getProjects,
  createProject,
  deleteProject,
  uploadProjectFiles,
  deleteProjectFiles,
} from '../controllers/workspace';
const router = express.Router();

router.route('/dashboard').get(getProjects);
router.route('/projects').post(createProject);

router.route('/projects/:projectId/delete').delete(deleteProject);
router.route('/projects/:projectId/uploadFiles').put(fileUploadMulter.any(), uploadProjectFiles);
router.route('/projects/:projectId/removeFiles').put(deleteProjectFiles);

export default router;
