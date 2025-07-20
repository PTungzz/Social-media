import React, { useState, useEffect } from 'react';
import { authAPI, chatAPI } from '../services/api';
import './ChatList.css';

const ChatList = ({ onSelectChat, selectedChatId, refreshTrigger }) => {
    const [chatList, setChatList] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'users'
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, [refreshTrigger]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch chat list
            const chatResponse = await chatAPI.getChatList();
            const usersResponse = await authAPI.getAllUsers();

            if (chatResponse.data.success) {
                setChatList(chatResponse.data.chatList);
            }

            if (usersResponse.data.success) {
                setAllUsers(usersResponse.data.users);
                setFilteredUsers(usersResponse.data.users);
            }
        } catch (error) {
            console.error('Lỗi lấy dữ liệu:', error);
            setError('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffInHours < 48) {
            return 'Hôm qua';
        } else {
            return date.toLocaleDateString('vi-VN');
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        
        if (query.trim() === '') {
            setFilteredUsers(allUsers);
        } else {
            const filtered = allUsers.filter(user => 
                user.username.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered);
        }
    };

    if (loading) {
        return <div className="chat-list-loading">Đang tải...</div>;
    }

    if (error) {
        return <div className="chat-list-error">{error}</div>;
    }

    return (
        <div className="chat-list">
            <div className="chat-list-header">
                <div className="chat-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'chats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chats')}
                    >
                        Tin nhắn ({chatList.length})
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Người dùng ({allUsers.length})
                    </button>
                </div>
            </div>
            
            {loading ? (
                <div className="chat-list-loading">Đang tải...</div>
            ) : error ? (
                <div className="chat-list-error">{error}</div>
            ) : activeTab === 'chats' ? (
                // Chat List Tab
                chatList.length === 0 ? (
                    <div className="no-chats">
                        <p>Chưa có cuộc trò chuyện nào</p>
                        <p>Chuyển sang tab "Người dùng" để bắt đầu chat</p>
                    </div>
                ) : (
                    <div className="chat-items">
                        {chatList.map((chat) => (
                            <div
                                key={chat.user._id}
                                className={`chat-item ${selectedChatId === chat.user._id ? 'active' : ''}`}
                                onClick={() => onSelectChat(chat.user)}
                            >
                                <div className="chat-avatar">
                                    <img 
                                                                src={chat.user.avatar || '/unnamed.jpg'}
                        alt={chat.user.username}
                        onError={(e) => {
                            e.target.src = '/unnamed.jpg';
                        }}
                                    />
                                    {chat.unreadCount > 0 && (
                                        <span className="unread-badge">{chat.unreadCount}</span>
                                    )}
                                </div>
                                
                                <div className="chat-info">
                                    <div className="chat-header">
                                        <h4>{chat.user.username}</h4>
                                        <span className="chat-time">
                                            {formatTime(chat.lastMessage.createdAt)}
                                        </span>
                                    </div>
                                    
                                    <div className="chat-preview">
                                        <p>
                                            {chat.lastMessage.sender._id === chat.user._id 
                                                ? `${chat.user.username}: ` 
                                                : 'Bạn: '
                                            }
                                            {chat.lastMessage.content.length > 30 
                                                ? chat.lastMessage.content.substring(0, 30) + '...'
                                                : chat.lastMessage.content
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                // Users Tab
                <>
                    <div className="users-search">
                        <input
                            type="text"
                            placeholder="Tìm kiếm người dùng..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="search-input"
                        />
                    </div>
                    <div className="chat-items">
                        {filteredUsers.map((user) => (
                            <div
                                key={user._id}
                                className={`chat-item ${selectedChatId === user._id ? 'active' : ''}`}
                                onClick={() => onSelectChat(user)}
                            >
                                <div className="chat-avatar">
                                    <img 
                                                                src={user.avatar || '/unnamed.jpg'}
                        alt={user.username}
                        onError={(e) => {
                            e.target.src = '/unnamed.jpg';
                        }}
                                    />
                                </div>
                                
                                <div className="chat-info">
                                    <div className="chat-header">
                                        <h4>{user.username}</h4>
                                    </div>
                                    
                                    <div className="chat-preview">
                                        <p>Click để bắt đầu chat</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatList; 