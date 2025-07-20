import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { authAPI } from '../services/api';
import './Chat.css';

const Chat = () => {
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
                        console.log('Current user from MongoDB:', response.data.user);
                        setCurrentUser(response.data.user);
                    }
                }
            } catch (error) {
                console.error('Lỗi lấy thông tin user:', error);
                // Fallback to localStorage nếu API fail
                const userInfo = localStorage.getItem('user');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    console.log('Current user from localStorage (fallback):', user);
                    setCurrentUser(user);
                }
            }
        };

        fetchCurrentUser();
    }, []);

    const handleSelectChat = (user) => {
        setSelectedUser(user);
    };

    const handleMessageSent = () => {
        // Trigger refresh chat list
        setRefreshChatList(prev => !prev);
    };

    return (
        <div className="chat-container">
            <div className="chat-sidebar">
                <ChatList 
                    onSelectChat={handleSelectChat}
                    selectedChatId={selectedUser?._id}
                    refreshTrigger={refreshChatList}
                />
            </div>
            <div className="chat-main">
                <ChatWindow 
                    selectedUser={selectedUser}
                    currentUser={currentUser}
                    onMessageSent={handleMessageSent}
                />
            </div>
        </div>
    );
};

export default Chat; 