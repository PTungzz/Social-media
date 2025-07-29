import express from 'express';
import multer from 'multer';
import path from 'path';
import { createPost, getPosts, getUserPosts, likePost, unlikePost, addComment, updateComment, deleteComment, likeComment, unlikeComment, replyToComment, updateReply, deleteReply } from '../controllers/postController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Cấu hình lưu file với multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), 'uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Tạo bài viết mới (có thể kèm ảnh)
router.post('/', verifyToken, upload.single('image'), createPost);

// Lấy danh sách bài viết
router.get('/', getPosts);

// Lấy danh sách bài viết của một user cụ thể
router.get('/user/:userId', getUserPosts);

router.post('/:postId/like', verifyToken, likePost);
router.delete('/:postId/like', verifyToken, unlikePost);
router.post('/:postId/comments', verifyToken, addComment);
router.put('/:postId/comments/:commentId', verifyToken, updateComment);
router.delete('/:postId/comments/:commentId', verifyToken, deleteComment);
router.post('/:postId/comments/:commentId/like', verifyToken, likeComment);
router.delete('/:postId/comments/:commentId/like', verifyToken, unlikeComment);
router.post('/:postId/comments/:commentId/reply', verifyToken, replyToComment);
router.put('/:postId/comments/:commentId/reply/:replyId', verifyToken, updateReply);
router.delete('/:postId/comments/:commentId/reply/:replyId', verifyToken, deleteReply);

export default router;
