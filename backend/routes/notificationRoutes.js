import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    getUnreadCount, 
    deleteNotification 
} from '../controllers/notificationController.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(verifyToken);

// GET /api/notifications - Lấy danh sách notifications
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Lấy số lượng chưa đọc
router.get('/unread-count', getUnreadCount);

// PUT /api/notifications/:notificationId/read - Đánh dấu đã đọc
router.put('/:notificationId/read', markAsRead);

// PUT /api/notifications/mark-all-read - Đánh dấu tất cả đã đọc
router.put('/mark-all-read', markAllAsRead);

// DELETE /api/notifications/:notificationId - Xóa notification
router.delete('/:notificationId', deleteNotification);

export default router;
