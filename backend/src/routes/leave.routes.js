import { Router } from 'express';
import {
  approveLeave,
  createLeave,
  deleteLeave,
  getLeaveById,
  listLeaves,
  rejectLeave,
  updateLeave,
} from '../controllers/leave.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listLeaves);
router.post('/', createLeave);
router.post('/apply', createLeave);
router.get('/:leaveId', getLeaveById);
router.put('/:leaveId', requireRole('admin', 'teamlead'), updateLeave);
router.delete('/:leaveId', requireRole('admin', 'teamlead'), deleteLeave);
router.patch('/:leaveId/approve', requireRole('admin', 'teamlead'), approveLeave);
router.patch('/:leaveId/reject', requireRole('admin', 'teamlead'), rejectLeave);

export default router;