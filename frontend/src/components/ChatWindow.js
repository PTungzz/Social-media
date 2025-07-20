import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { chatAPI } from '../services/api';
import './ChatWindow.css';

const ChatWindow = ({ selectedUser, currentUser, onMessageSent, isDarkMode }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    // Format tên người dùng (viết hoa chữ cái đầu)
    const formatUserName = (user) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)} ${user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1)}`;
        }
        if (user.name) {
            return user.name.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
        }
        return user.username || 'Unknown User';
    };

    useEffect(() => {
        if (selectedUser) {
            fetchMessages();
            initializeSocket();
        }
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Đóng emoji picker khi click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEmojiPicker && !event.target.closest('.emoji-picker') && !event.target.closest('.emoji-button')) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    const initializeSocket = () => {
        const token = localStorage.getItem('token');
        const newSocket = io('http://localhost:5001', {
            auth: { token }
        });

        newSocket.on('connect', () => {
            setSocket(newSocket);
            newSocket.emit('set_online');
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection failed:', error);
            setSocket(null);
        });

        newSocket.on('disconnect', (reason) => {
            setSocket(null);
        });

        newSocket.on('receive_message', (data) => {
            const selectedUserId = selectedUser._id || selectedUser.id;
            
            if (data.message.sender._id === selectedUserId) {
                setMessages(prev => [...prev, data.message]);
                markAsRead();
            }
        });

        newSocket.on('message_sent', (data) => {
            // Thêm tin nhắn vừa gửi vào danh sách
            setMessages(prev => [...prev, data.message]);
        });

        newSocket.on('user_typing', (data) => {
            const selectedUserId = selectedUser._id || selectedUser.id;
            if (data.userId === selectedUserId) {
                setIsTyping(data.isTyping);
            }
        });

        newSocket.on('messages_read', (data) => {
            // Có thể cập nhật trạng thái đã đọc ở đây
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        setSocket(newSocket);
    };

    const fetchMessages = async () => {
        try {
            if (!selectedUser?._id && !selectedUser?.id) {
                return;
            }
            
            setLoading(true);
            const userId = selectedUser._id || selectedUser.id;
            
            const response = await chatAPI.getMessages(userId);

            if (response.data.success) {
                setMessages(response.data.messages);
                if (response.data.messages.length > 0) {
                    markAsRead();
                }
            }
        } catch (error) {
            console.error('❌ Lỗi lấy tin nhắn:', error);
            // Nếu chưa có tin nhắn, không cần báo lỗi
            if (error.response?.status !== 404) {
                console.error('🚫 Unexpected error:', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            const selectedUserId = selectedUser._id || selectedUser.id;
            await chatAPI.markAsRead(selectedUserId);

            if (socket) {
                socket.emit('mark_as_read', { senderId: selectedUserId });
            }
        } catch (error) {
            console.error('Lỗi mark as read:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        
        if (!newMessage.trim() && !selectedFile) return;
        
        if (!selectedUser?._id && !selectedUser?.id) {
            console.error('No selected user to send message to');
            return;
        }

        const receiverId = selectedUser._id || selectedUser.id;
        const messageData = {
            receiverId: receiverId,
            content: newMessage.trim(),
            image: filePreview
        };

        // Nếu có socket, gửi qua WebSocket
        if (socket) {
            socket.emit('send_message', messageData);
        } else {
            // Nếu không có socket, gửi qua HTTP API
            try {
                const response = await chatAPI.sendMessage(messageData);
                console.log('API response:', response);
                
                // Thêm tin nhắn vào danh sách local
                const newMessageObj = {
                    _id: Date.now().toString(),
                    sender: currentUser,
                    receiver: selectedUser,
                    content: newMessage.trim(),
                    image: filePreview,
                    createdAt: new Date().toISOString(),
                    seen: false
                };
                console.log('Adding message to local state:', newMessageObj);
                setMessages(prev => [...prev, newMessageObj]);
            } catch (error) {
                console.error('Lỗi gửi tin nhắn:', error);
                alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
                return;
            }
        }

        setNewMessage('');
        setSelectedFile(null);
        setFilePreview(null);
        setTyping(false);

        if (socket) {
            const receiverId = selectedUser._id || selectedUser.id;
            socket.emit('typing', { receiverId: receiverId, isTyping: false });
        }

        // Callback để refresh chat list
        if (onMessageSent) {
            onMessageSent();
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        
        if (!typing) {
            setTyping(true);
            if (socket) {
                const receiverId = selectedUser._id || selectedUser.id;
                socket.emit('typing', { receiverId: receiverId, isTyping: true });
            }
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            setTyping(false);
            if (socket) {
                const receiverId = selectedUser._id || selectedUser.id;
                socket.emit('typing', { receiverId: receiverId, isTyping: false });
            }
        }, 1000);
    };

    const handleEmojiClick = (emojiObject) => {
        console.log('Emoji clicked:', emojiObject.emoji);
        setNewMessage(prev => prev + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        console.log('File selected:', file);
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
                return;
            }
            
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('File preview generated');
                setFilePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    if (!selectedUser) {
        return (
            <div className="chat-window-empty">
                <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
        );
    }

    console.log('Current user in chat:', currentUser);
    console.log('Current user ID type:', typeof currentUser._id, 'Value:', currentUser._id);

    return (
        <div className={`chat-window ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="chat-header">
                <div className="chat-user-info">
                    <img 
                        src={selectedUser.avatar || '/unnamed.jpg'} 
                        alt={formatUserName(selectedUser)}
                        onError={(e) => {
                            e.target.src = '/unnamed.jpg';
                        }}
                    />
                    <div>
                        <h3>{formatUserName(selectedUser)}</h3>
                        {isTyping && <span className="typing-indicator">Đang nhập...</span>}
                    </div>
                </div>
            </div>

            <div className="chat-messages">
                {loading ? (
                    <div className="messages-loading">Đang tải tin nhắn...</div>
                ) : (
                    <>
                        {messages.map((message) => {
                            // Debug để xem cấu trúc dữ liệu
                            console.log('Message sender:', message.sender);
                            console.log('Current user:', currentUser);
                            
                            // So sánh bằng _id từ MongoDB
                            const isOwnMessage = message.sender._id === currentUser._id;
                            
                            console.log('Sender ID:', message.sender._id, 'Current User ID:', currentUser._id, 'Is Own:', isOwnMessage);
                            
                            return (
                                <div
                                    key={message._id}
                                    className={`message ${isOwnMessage ? 'sent' : 'received'}`}
                                >
                                    {!isOwnMessage && (
                                        <img 
                                            className="message-avatar"
                                            src={message.sender.avatar || '/unnamed.jpg'}
                                            alt={formatUserName(message.sender)}
                                            onError={(e) => {
                                                e.target.src = '/unnamed.jpg';
                                            }}
                                        />
                                    )}
                                    <div className="message-content">
                                        {message.content && <p>{message.content}</p>}
                                        {message.image && (
                                            <img 
                                                src={message.image} 
                                                alt="Shared content" 
                                                className="message-image"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        )}
                                        <span className="message-time">
                                            {formatTime(message.createdAt)}
                                        </span>
                                    </div>
                                    {isOwnMessage && (
                                        <img 
                                            className="message-avatar"
                                            src={currentUser.avatar || '/unnamed.jpg'}
                                            alt={currentUser.username}
                                            onError={(e) => {
                                                e.target.src = '/unnamed.jpg';
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <form className="chat-input" onSubmit={sendMessage}>
                {filePreview && (
                    <div className="file-preview">
                        <img src={filePreview} alt="Preview" />
                        <button type="button" onClick={removeFile} className="remove-file">
                            ✕
                        </button>
                    </div>
                )}
                <div className="input-controls">
                    <button 
                        type="button" 
                        className={`emoji-button ${showEmojiPicker ? 'active' : ''}`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        😊
                    </button>
                    <button 
                        type="button" 
                        className="file-button"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        📎
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Nhập tin nhắn..."
                        disabled={!selectedUser}
                    />
                    <button type="submit" disabled={!newMessage.trim() && !selectedFile}>
                        Gửi
                    </button>
                </div>
                {showEmojiPicker && (
                    <div className="emoji-picker">
                        <div className="emoji-grid">
                            {['😊', '😂', '❤️', '👍', '🎉', '🔥', '😍', '🤔', '😭', '😡', '😱', '🤗', '😎', '🥰', '😴', '🤩', '😋', '🤪', '😇', '🤠', '👻', '🤖', '👽', '👾'].map((emoji, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="emoji-item"
                                    onClick={() => handleEmojiClick({ emoji })}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default ChatWindow; 