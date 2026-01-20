import express from 'express';
import BookingNotificationController from '../controllers/bookingNotificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/unread-count', BookingNotificationController.getUnreadCount);
router.get('/', BookingNotificationController.getAllNotifications);
router.get('/unread', BookingNotificationController.getUnreadNotifications);
router.patch('/:notificationId/read', BookingNotificationController.markAsRead);
router.patch('/mark-all-read', BookingNotificationController.markAllAsRead);
router.get('/type/:type', BookingNotificationController.getNotificationsByType);
router.get('/priority/:priority', BookingNotificationController.getNotificationsByPriority);
router.get('/summary', BookingNotificationController.getNotificationSummary);

export default router;
