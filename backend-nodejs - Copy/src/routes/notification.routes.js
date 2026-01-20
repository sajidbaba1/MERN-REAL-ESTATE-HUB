import express from 'express';
import NotificationController from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/unread-count', NotificationController.unreadCount);
router.get('/recent', NotificationController.recent);
router.patch('/:id/read', NotificationController.markRead);

export default router;
