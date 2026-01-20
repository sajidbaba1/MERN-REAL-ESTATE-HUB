import BookingNotification from '../models/BookingNotification.js';
import bookingNotificationService from '../services/bookingNotificationService.js';

class BookingNotificationController {
    async getUnreadCount(req, res) {
        try {
            const count = await bookingNotificationService.getUnreadCount(req.user.id);
            res.json({ unreadCount: count });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getAllNotifications(req, res) {
        try {
            const page = parseInt(req.query.page) || 0;
            const size = parseInt(req.query.size) || 20;

            const notifications = await BookingNotification.find({ recipient: req.user.id })
                .sort({ createdAt: -1 })
                .skip(page * size)
                .limit(size)
                .populate('rentBooking')
                .populate('pgBooking');

            const totalElements = await BookingNotification.countDocuments({ recipient: req.user.id });

            res.json({
                notifications,
                totalElements,
                totalPages: Math.ceil(totalElements / size),
                currentPage: page,
                pageSize: size
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getUnreadNotifications(req, res) {
        try {
            const notifications = await BookingNotification.find({
                recipient: req.user.id,
                isRead: false
            })
                .sort({ createdAt: -1 })
                .populate('rentBooking')
                .populate('pgBooking');

            res.json(notifications);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async markAsRead(req, res) {
        try {
            await bookingNotificationService.markAsRead(req.params.notificationId, req.user.id);
            res.json({ status: 'success', message: 'Notification marked as read' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async markAllAsRead(req, res) {
        try {
            await BookingNotification.updateMany(
                { recipient: req.user.id, isRead: false },
                { $set: { isRead: true, readAt: new Date() } }
            );
            res.json({ status: 'success', message: 'All notifications marked as read' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getNotificationsByType(req, res) {
        try {
            const { type } = req.params;
            const page = parseInt(req.query.page) || 0;
            const size = parseInt(req.query.size) || 10;

            const notifications = await BookingNotification.find({
                recipient: req.user.id,
                type
            })
                .sort({ createdAt: -1 })
                .skip(page * size)
                .limit(size);

            const totalElements = await BookingNotification.countDocuments({
                recipient: req.user.id,
                type
            });

            res.json({
                notifications,
                totalElements,
                totalPages: Math.ceil(totalElements / size),
                type
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getNotificationsByPriority(req, res) {
        try {
            const { priority } = req.params;
            const page = parseInt(req.query.page) || 0;
            const size = parseInt(req.query.size) || 10;

            const notifications = await BookingNotification.find({
                recipient: req.user.id,
                priority
            })
                .sort({ createdAt: -1 })
                .skip(page * size)
                .limit(size);

            const totalElements = await BookingNotification.countDocuments({
                recipient: req.user.id,
                priority
            });

            res.json({
                notifications,
                totalElements,
                totalPages: Math.ceil(totalElements / size),
                priority
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getNotificationSummary(req, res) {
        try {
            const allNotifications = await BookingNotification.find({ recipient: req.user.id });
            const unreadCount = await bookingNotificationService.getUnreadCount(req.user.id);

            // Count by type
            const typeCount = {};
            const priorityCount = {};

            allNotifications.forEach(notification => {
                typeCount[notification.type] = (typeCount[notification.type] || 0) + 1;
                priorityCount[notification.priority] = (priorityCount[notification.priority] || 0) + 1;
            });

            res.json({
                totalNotifications: allNotifications.length,
                unreadNotifications: unreadCount,
                notificationsByType: typeCount,
                notificationsByPriority: priorityCount
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new BookingNotificationController();
