import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  updateProject,
} from '../controllers/project.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listProjects);
router.post('/', requireRole('admin', 'teamlead'), createProject);
router.get('/:projectId', getProjectById);
router.put('/:projectId', requireRole('admin', 'teamlead'), updateProject);
router.delete('/:projectId', requireRole('admin', 'teamlead'), deleteProject);

export default router;