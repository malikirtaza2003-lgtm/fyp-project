import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getSettings);
router.put('/', requireRole('admin'), updateSettings);
router.patch('/', requireRole('admin'), updateSettings);

export default router;
