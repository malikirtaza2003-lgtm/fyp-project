import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from '../controllers/task.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listTasks);
router.post('/', requireRole('admin', 'teamlead'), createTask);
router.get('/:taskId', getTaskById);
router.put('/:taskId', updateTask);
router.delete('/:taskId', requireRole('admin', 'teamlead'), deleteTask);

export default router;