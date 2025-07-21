import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';

let io;

export const initializeWebSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Middleware xác thực JWT
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔗 User connected: ${socket.user.username} (${socket.userId})`);
        console.log(`📍 User joined room: ${socket.userId}`);

        // Join room với user ID để nhận tin nhắn
        socket.join(socket.userId);

        // Emit user online status
        socket.on('set_online', () => {
            console.log(`🟢 User ${socket.user.username} is now online`);
            socket.broadcast.emit('user_online', {
                userId: socket.userId,
                username: socket.user.username
            });
        });

        // Xử lý gửi tin nhắn
        socket.on('send_message', async (data) => {
            try {
                console.log(`📤 Message received from ${socket.user.username}:`, data);
                const { receiverId, content, image } = data;

                if ((!content || content.trim() === '') && !image) {
                    socket.emit('error', { message: 'Nội dung hoặc ảnh là bắt buộc' });
                    return;
                }

                // Kiểm tra người nhận có tồn tại không
                const receiver = await User.findById(receiverId);
                if (!receiver) {
                    console.log(`❌ Receiver not found: ${receiverId}`);
                    socket.emit('error', { message: 'Người nhận không tồn tại' });
                    return;
                }

                console.log(`📝 Saving message from ${socket.user.username} to ${receiver.username}`);

                // Lưu tin nhắn vào database
                const newMessage = new ChatMessage({
                    sender: socket.userId,
                    receiver: receiverId,
                    content: content || '',
                    image: image || ''
                });

                await newMessage.save();
                await newMessage.populate('sender', 'username avatar firstName lastName');
                await newMessage.populate('receiver', 'username avatar firstName lastName');

                console.log(`💾 Message saved successfully:`, newMessage._id);

                // Gửi tin nhắn đến người nhận
                console.log(`📬 Sending to receiver room: ${receiverId}`);
                socket.to(receiverId).emit('receive_message', {
                    message: newMessage,
                    sender: socket.user
                });

                // Emit new_message event for notification system
                socket.to(receiverId).emit('new_message', {
                    senderId: socket.userId,
                    receiverId: receiverId,
                    messageId: newMessage._id,
                    content: content || '',
                    senderName: `${socket.user.firstName || ''} ${socket.user.lastName || ''}`.trim() || socket.user.username
                });

                // Gửi xác nhận về cho người gửi
                console.log(`✅ Sending confirmation to sender: ${socket.userId}`);
                socket.emit('message_sent', {
                    message: newMessage
                });

            } catch (error) {
                console.error('Lỗi gửi tin nhắn:', error);
                socket.emit('error', { message: 'Lỗi gửi tin nhắn' });
            }
        });

        // Xử lý typing indicator
        socket.on('typing', (data) => {
            const { receiverId, isTyping } = data;
            socket.to(receiverId).emit('user_typing', {
                userId: socket.userId,
                username: socket.user.username,
                isTyping
            });
        });

        // Xử lý đánh dấu đã đọc
        socket.on('mark_as_read', async (data) => {
            try {
                const { senderId } = data;

                await ChatMessage.updateMany(
                    {
                        sender: senderId,
                        receiver: socket.userId,
                        seen: false
                    },
                    {
                        seen: true
                    }
                );

                // Thông báo cho người gửi rằng tin nhắn đã được đọc
                socket.to(senderId).emit('messages_read', {
                    readerId: socket.userId,
                    readerName: socket.user.username
                });

                // Emit messages_read event for current user's notification system
                socket.emit('messages_read', {
                    userId: socket.userId
                });

            } catch (error) {
                console.error('Lỗi đánh dấu đã đọc:', error);
            }
        });

        // Xử lý online status
        socket.on('set_online', () => {
            socket.broadcast.emit('user_online', {
                userId: socket.userId,
                username: socket.user.username
            });
        });

        // Xử lý disconnect
        socket.on('disconnect', () => {
            console.log(`🔴 User disconnected: ${socket.user.username} (${socket.userId})`);
            socket.broadcast.emit('user_offline', {
                userId: socket.userId,
                username: socket.user.username
            });
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
