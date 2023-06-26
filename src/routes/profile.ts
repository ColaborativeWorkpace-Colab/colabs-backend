import express from 'express';
import {
  getProfile,
  editProfile,
  getSVTs,
  submitSolution,
  addSVT,
  getPendingSolutions,
  scoreSolution,
  getProfiles,
  getMultipleProfileData,
} from '../controllers/profile';

const router = express.Router();

router.route('/:userId').get(getProfile).put(editProfile);
router.route('/skills/:skill').get(getSVTs);
router.route('/skills/:skillId/submit').post(submitSolution);

router.route('/skills/:regulatorId/addSVT').post(addSVT);
router.route('/data').post(getMultipleProfileData);
router.route('/skills/:regulatorId/solutions').get(getPendingSolutions);
router.route('/skills/:regulatorId/solutions/:solutionId/score').put(scoreSolution);

router.route('/connections/:userId').get(getProfiles);
export default router;
