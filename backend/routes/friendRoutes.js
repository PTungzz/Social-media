import express from 'express';
import { addFriend, getFriends, removeFriend, checkFriendship } from '../controllers/friendController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(protect);

// Lấy danh sách bạn bè
router.get('/', getFriends);

// Thêm bạn bè
router.post('/add', addFriend);

// Xóa bạn bè
router.delete('/:friendId', removeFriend);

// Kiểm tra có phải bạn bè không
router.get('/check/:friendId', checkFriendship);

export default router;
