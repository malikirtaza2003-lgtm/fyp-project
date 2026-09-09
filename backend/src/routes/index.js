import { Router } from 'express';
import authRoutes from './auth.routes.js';
import attendanceRoutes from './attendance.routes.js';
import departmentRoutes from './department.routes.js';
import healthRoutes from './health.routes.js';
import leaveRoutes from './leave.routes.js';
import meetingRoutes from './meeting.routes.js';
import projectRoutes from './projects.routes.js';
import settingsRoutes from './settings.routes.js';
import taskRoutes from './tasks.routes.js';
import userRoutes from './user.routes.js';
import announcementRoutes from './announcement.routes.js';
import notificationRoutes from './notification.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    message: 'API is ready',
  });
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/projects', projectRoutes);
router.use('/settings', settingsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/departments', departmentRoutes);
router.use('/meetings', meetingRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);

export default router;