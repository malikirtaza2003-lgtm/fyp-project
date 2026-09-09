import { Router } from 'express';
import { getMe } from '../controllers/auth.controller.js';
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateMe,
  updateUser,
} from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/me', getMe);
router.patch('/me', updateMe);

router.get('/', listUsers);
router.post('/', requireRole('admin'), createUser);
router.get('/:userId', requireRole('admin'), getUserById);
router.patch('/:userId', requireRole('admin'), updateUser);
router.delete('/:userId', requireRole('admin'), deleteUser);

export default router;