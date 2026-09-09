import { Router } from 'express';
import { getNotifications, markAllAsRead } from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);

export default router;
