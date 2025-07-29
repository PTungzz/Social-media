import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { registerValidation, loginValidation } from '../validations/authValidations.js';

// Register user
export const register = async (req, res) => {
    try {
        // Validate input
        const { error } = registerValidation.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email: req.body.email }, { username: req.body.username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Create new user
        const user = new User({
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPassword,
            location: req.body.location || '',
            occupation: req.body.occupation || '',
            avatar: req.body.avatar || ''
        });

        const savedUser = await user.save();

        // Create token
        const token = jwt.sign(
            { id: savedUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                email: savedUser.email,
                location: savedUser.location,
                occupation: savedUser.occupation,
                avatar: savedUser.avatar
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({ 
            message: 'Server error',
            details: error.message 
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        // Validate input
        const { error } = loginValidation.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Check if user exists
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                location: user.location,
                occupation: user.occupation,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current user
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User không tồn tại' });
        }
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Get all users (for chat)
export const getAllUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        
        const users = await User.find({ _id: { $ne: currentUserId } })
            .select('username firstName lastName email avatar createdAt')
            .sort({ firstName: 1, lastName: 1, username: 1 });

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log(`👤 Fetching user: ${userId}`);
        const startTime = Date.now();
        
        const user = await User.findById(userId).select('-password');
        
        const endTime = Date.now();
        console.log(`⏱️ User query took: ${endTime - startTime}ms`);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                location: user.location,
                occupation: user.occupation,
                avatar: user.avatar,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Get user by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
