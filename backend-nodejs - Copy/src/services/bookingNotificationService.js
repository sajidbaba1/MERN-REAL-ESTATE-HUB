import BookingNotification from '../models/BookingNotification.js';

class BookingNotificationService {
    async createNotification(recipient, type, title, message, link, rentBooking = null, pgBooking = null) {
        try {
            const notification = new BookingNotification({
                recipient: recipient._id || recipient,
                type,
                title,
                message,
                link,
                rentBooking: rentBooking?._id || rentBooking,
                pgBooking: pgBooking?._id || pgBooking
            });

            await notification.save();
            return notification;
        } catch (error) {
            console.error('Error creating booking notification:', error);
            throw error;
        }
    }

    async markAsRead(notificationId, userId) {
        try {
            const notification = await BookingNotification.findOne({
                _id: notificationId,
                recipient: userId
            });

            if (!notification) return null;

            notification.isRead = true;
            notification.readAt = new Date();
            await notification.save();
            return notification;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    async getUserNotifications(userId, limit = 20) {
        try {
            const notifications = await BookingNotification.find({ recipient: userId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('rentBooking')
                .populate('pgBooking');

            return notifications;
        } catch (error) {
            console.error('Error fetching user notifications:', error);
            throw error;
        }
    }

    async getUnreadCount(userId) {
        try {
            const count = await BookingNotification.countDocuments({
                recipient: userId,
                isRead: false
            });
            return count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }
}

export default new BookingNotificationService();
