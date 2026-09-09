import { Router } from 'express';
import {
  checkIn,
  createOrUpdateAttendance,
  deleteAttendance,
  getAttendanceById,
  listAttendance,
  resumeFromBreak,
  startBreak,
  checkOut,
  updateAttendance,
} from '../controllers/attendance.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listAttendance);
router.post('/', requireRole('admin', 'teamlead'), createOrUpdateAttendance);
router.get('/:attendanceId', getAttendanceById);
router.put('/:attendanceId', requireRole('admin', 'teamlead'), updateAttendance);
router.delete('/:attendanceId', requireRole('admin', 'teamlead'), deleteAttendance);

router.post('/check-in', checkIn);
router.post('/break', startBreak);
router.post('/resume', resumeFromBreak);
router.post('/check-out', checkOut);

export default router;