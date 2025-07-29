import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Tạo notification mới
export const createNotification = async (data) => {
    try {
        const { recipient, sender, type, message, postId = null, commentId = null } = data;
        
        // Không tạo notification cho chính mình
        if (recipient.toString() === sender.toString()) {
            return null;
        }

        const notification = new Notification({
            recipient,
            sender,
            type,
            message,
            postId,
            commentId
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

// Lấy danh sách notifications của user
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ recipient: userId })
            .populate('sender', 'firstName lastName avatar')
            .populate('postId', 'content image')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const unreadCount = await Notification.countDocuments({ 
            recipient: userId, 
            isRead: false 
        });

        res.json({
            success: true,
            notifications,
            unreadCount,
            currentPage: page,
            totalPages: Math.ceil(await Notification.countDocuments({ recipient: userId }) / limit)
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Đánh dấu notification đã đọc
export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { isRead: true }
        );

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Đánh dấu tất cả notifications đã đọc
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Lấy số lượng notifications chưa đọc
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const count = await Notification.countDocuments({ 
            recipient: userId, 
            isRead: false 
        });

        res.json({ success: true, count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Xóa notification
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: userId
        });

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
