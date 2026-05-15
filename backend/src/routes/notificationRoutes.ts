import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import notifications from '../controllers/notificationAdminController';

const router = Router();

router.get('/',                  authenticate,                 notifications.list         as any);
router.get('/unread-count',      authenticate,                 notifications.unreadCount  as any);
router.post('/:id/read',         authenticate,                 notifications.markRead     as any);
router.post('/read-all',         authenticate,                 notifications.markAllRead  as any);
router.delete('/',               authenticate,                 notifications.removeAll    as any);
router.delete('/:id',            authenticate,                 notifications.remove       as any);

// Admin/organiser broadcast — fans out to every user matching target_roles.
router.post('/broadcast',        authenticate, authorize(['admin', 'tournament_organiser']), notifications.broadcast as any);

export default router;
