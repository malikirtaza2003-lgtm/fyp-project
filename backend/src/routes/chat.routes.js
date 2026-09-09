import { Router } from 'express';
import { listMessages, sendMessage, updateReaction } from '../controllers/chat.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/:chatId', listMessages);
router.post('/:chatId', sendMessage);
router.post('/react/:messageId', updateReaction);

export default router;
