import express from 'express';
import { register, login, getAllUsers, getCurrentUser, getUserById } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getCurrentUser);
router.get('/users', protect, getAllUsers);
router.get('/user/:userId', protect, getUserById);

export default router;
