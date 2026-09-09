import { Router } from 'express';
import { createAnnouncement, getAnnouncements, markAsViewed } from '../controllers/announcement.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('admin'), createAnnouncement);
router.get('/', getAnnouncements);
router.patch('/:id/view', markAsViewed);

export default router;
