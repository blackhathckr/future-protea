import { Router } from 'express';
import notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/unread-count', authenticate, notificationController.getUnreadCount as any);

export default router;
