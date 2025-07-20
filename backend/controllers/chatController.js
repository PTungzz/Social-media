import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';

// Gửi tin nhắn
export const sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        if (!content && !req.body.image) {
            return res.status(400).json({ message: 'Nội dung hoặc ảnh là bắt buộc' });
        }

        // Kiểm tra người nhận có tồn tại không
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Người nhận không tồn tại' });
        }

        const newMessage = new ChatMessage({
            sender: senderId,
            receiver: receiverId,
            content,
            image: req.body.image || ''
        });

        await newMessage.save();

        // Populate thông tin người gửi
        await newMessage.populate('sender', 'username avatar');

        res.status(201).json({
            success: true,
            message: newMessage
        });
    } catch (error) {
        console.error('Lỗi gửi tin nhắn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Lấy tin nhắn giữa 2 người dùng
export const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;
        
        console.log('📨 getMessages called');
        console.log('📋 Target user ID:', userId);
        console.log('👤 Current user ID:', currentUserId);
        console.log('🔍 Current user object:', req.user);

        if (!userId || !currentUserId) {
            console.log('❌ Missing user IDs');
            return res.status(400).json({ 
                success: false, 
                message: 'User IDs are required' 
            });
        }

        console.log('🔎 Searching for messages...');
        const messages = await ChatMessage.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        })
        .populate('sender', 'username avatar firstName lastName')
        .populate('receiver', 'username avatar firstName lastName')
        .sort({ createdAt: 1 });

        console.log(`📊 Found ${messages.length} messages`);

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('❌ Lỗi lấy tin nhắn:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server', 
            error: error.message 
        });
    }
};

// Lấy danh sách chat (người dùng đã chat với)
export const getChatList = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // Lấy tất cả tin nhắn của user hiện tại
        const messages = await ChatMessage.find({
            $or: [
                { sender: currentUserId },
                { receiver: currentUserId }
            ]
        }).populate('sender', 'username avatar').populate('receiver', 'username avatar');

        // Tạo map để lưu tin nhắn cuối cùng với mỗi người dùng
        const chatMap = new Map();

        messages.forEach(message => {
            const otherUserId = message.sender._id.toString() === currentUserId 
                ? message.receiver._id.toString() 
                : message.sender._id.toString();
            
            const otherUser = message.sender._id.toString() === currentUserId 
                ? message.receiver 
                : message.sender;

            if (!chatMap.has(otherUserId) || message.createdAt > chatMap.get(otherUserId).lastMessage.createdAt) {
                chatMap.set(otherUserId, {
                    user: otherUser,
                    lastMessage: message,
                    unreadCount: 0
                });
            }
        });

        // Tính số tin nhắn chưa đọc
        const unreadMessages = await ChatMessage.find({
            receiver: currentUserId,
            seen: false
        });

        unreadMessages.forEach(message => {
            const senderId = message.sender.toString();
            if (chatMap.has(senderId)) {
                const chat = chatMap.get(senderId);
                chat.unreadCount++;
                chatMap.set(senderId, chat);
            }
        });

        const chatList = Array.from(chatMap.values()).sort((a, b) => 
            b.lastMessage.createdAt - a.lastMessage.createdAt
        );

        res.json({
            success: true,
            chatList
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách chat:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Đánh dấu tin nhắn đã đọc
export const markAsRead = async (req, res) => {
    try {
        const { senderId } = req.params;
        const currentUserId = req.user.id;

        await ChatMessage.updateMany(
            {
                sender: senderId,
                receiver: currentUserId,
                seen: false
            },
            {
                seen: true
            }
        );

        res.json({
            success: true,
            message: 'Đã đánh dấu đã đọc'
        });
    } catch (error) {
        console.error('Lỗi đánh dấu đã đọc:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Lấy số lượng tin nhắn chưa đọc
export const getUnreadCount = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        const unreadCount = await ChatMessage.countDocuments({
            receiver: currentUserId,
            seen: false
        });

        res.json({
            success: true,
            count: unreadCount
        });
    } catch (error) {
        console.error('Lỗi lấy số tin nhắn chưa đọc:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Đánh dấu tất cả tin nhắn đã đọc
export const markAllAsRead = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        await ChatMessage.updateMany(
            {
                receiver: currentUserId,
                seen: false
            },
            {
                seen: true
            }
        );

        res.json({
            success: true,
            message: 'Đã đánh dấu tất cả tin nhắn đã đọc'
        });
    } catch (error) {
        console.error('Lỗi đánh dấu tất cả đã đọc:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
