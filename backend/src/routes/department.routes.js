import { Router } from 'express';
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '../controllers/department.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listDepartments);
router.post('/', requireRole('admin'), createDepartment);
router.put('/:departmentId', requireRole('admin'), updateDepartment);
router.delete('/:departmentId', requireRole('admin'), deleteDepartment);

export default router;
