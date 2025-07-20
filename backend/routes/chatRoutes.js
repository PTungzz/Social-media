import express from 'express';
import { sendMessage, getMessages, getChatList, markAsRead } from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(protect);

// Gửi tin nhắn
router.post('/send', sendMessage);

// Lấy tin nhắn với một người dùng cụ thể
router.get('/messages/:userId', getMessages);

// Lấy danh sách chat
router.get('/list', getChatList);

// Đánh dấu tin nhắn đã đọc
router.put('/read/:senderId', markAsRead);

export default router;
