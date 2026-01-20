import Notification from '../models/Notification.js';

class NotificationController {
    async unreadCount(req, res) {
        try {
            const count = await Notification.countDocuments({
                recipient: req.user.id,
                isRead: false
            });
            res.json({ unread: count });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async recent(req, res) {
        try {
            const list = await Notification.find({ recipient: req.user.id })
                .sort({ createdAt: -1 })
                .limit(20);
            res.json(list);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async markRead(req, res) {
        try {
            const notification = await Notification.findById(req.params.id);
            if (!notification) return res.status(404).json({ message: 'Notification not found' });

            if (notification.recipient.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            notification.isRead = true;
            await notification.save();
            res.json({ status: 'ok' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new NotificationController();
