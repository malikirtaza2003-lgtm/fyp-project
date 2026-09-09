import { Router } from 'express';
import { createMeeting, listMeetings, updateMeeting } from '../controllers/meeting.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listMeetings);
router.post('/', createMeeting);
router.put('/:meetingId', updateMeeting);

export default router;
