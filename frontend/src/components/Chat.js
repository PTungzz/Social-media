import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { authAPI, chatAPI } from '../services/api';
import './Chat.css';

const Chat = ({ onNavigateToHome, isDarkMode, setIsDarkMode }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [refreshChatList, setRefreshChatList] = useState(false);

    useEffect(() => {
        // Lấy thông tin user hiện tại từ MongoDB
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem('token');
                
                if (token) {
                    const response = await authAPI.getCurrentUser();
                    
                    if (response.data.success) {
                        setCurrentUser(response.data.user);
                    }
                }
            } catch (error) {
                console.error('❌ Lỗi lấy thông tin user:', error);
                // Fallback to localStorage nếu API fail
                const userInfo = localStorage.getItem('user');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    setCurrentUser(user);
                }
            }
        };

        fetchCurrentUser();
    }, []);

    // Mark all messages as read when user enters Chat page
    useEffect(() => {
        const markMessagesAsRead = async () => {
            try {
                await chatAPI.markAllAsRead();
                console.log('✅ All messages marked as read when entering Chat');
            } catch (error) {
                console.error('Failed to mark messages as read:', error);
            }
        };

        if (currentUser) {
            markMessagesAsRead();
        }
    }, [currentUser]);

    const handleSelectChat = (user) => {
        setSelectedUser(user);
    };

    const handleMessageSent = () => {
        // Trigger refresh chat list
        setRefreshChatList(prev => !prev);
    };

    const handleBackToHome = () => {
        if (onNavigateToHome) {
            onNavigateToHome();
        }
    };

    return (
        <div className={`chat-page ${isDarkMode ? 'dark-mode' : ''}`}>
            {/* Top Bar với button Quay lại và text Tin nhắn */}
            <div className="top-bar">
                <div className="top-bar-left">
                    <button className="back-button" onClick={handleBackToHome}>
                        ← Quay lại
                    </button>
                    <span className="page-title">Tin nhắn</span>
                </div>
                <h1 className="logo">Sociopedia</h1>
                <div className="top-bar-right">
                    <button 
                        className="icon-button dark-mode-toggle"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDarkMode ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="chat-content">
                <div className="chat-sidebar">
                    <ChatList 
                        onSelectChat={handleSelectChat}
                        selectedChatId={selectedUser?.id || selectedUser?._id}
                        refreshTrigger={refreshChatList}
                        currentUser={currentUser}
                        isDarkMode={isDarkMode}
                    />
                </div>
                <div className="chat-main">
                    <ChatWindow 
                        selectedUser={selectedUser}
                        currentUser={currentUser}
                        onMessageSent={handleMessageSent}
                        isDarkMode={isDarkMode}
                    />
                </div>
            </div>
        </div>
    );
};

export default Chat; 