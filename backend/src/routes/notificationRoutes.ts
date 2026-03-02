import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, notificationController.getNotifications);
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);
router.put('/:notificationId/read', authMiddleware, notificationController.markAsRead);
router.put('/:notificationId/unread', authMiddleware, notificationController.markAsUnread);
router.put('/read-all', authMiddleware, notificationController.markAllAsRead);
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

export default router;
