import React, { useState, useEffect, useCallback } from 'react';
import { friendsAPI } from '../services/api';
import './ChatList.css';

const ChatList = ({ onSelectChat, selectedChatId, refreshTrigger, currentUser, isDarkMode }) => {
    const [friendsData, setFriendsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadFriends = useCallback(async () => {
        try {
            setLoading(true);
            
            if (!currentUser?.id && !currentUser?._id) {
                setLoading(false);
                return;
            }

            // Lấy danh sách bạn bè từ backend API
            const response = await friendsAPI.getFriends();
            
            if (response.data.success) {
                setFriendsData(response.data.friends);
            } else {
                setFriendsData([]);
            }
            
        } catch (error) {
            console.error('❌ Lỗi load friends từ backend:', error);
            setFriendsData([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        loadFriends();
    }, [refreshTrigger, currentUser, loadFriends]);

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

    // Filter friends theo search query
    const filteredFriends = friendsData.filter(friend => {
        const name = formatUserName(friend).toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });
    return (
        <div className={`chat-list ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="chat-list-header">
                <h3>Bạn bè ({friendsData.length})</h3>
                {friendsData.length > 0 && (
                    <div className="friends-search">
                        <input
                            type="text"
                            placeholder="Tìm kiếm bạn bè..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                )}
            </div>
            
            {loading ? (
                <div className="chat-list-loading">Đang tải...</div>
            ) : friendsData.length === 0 ? (
                <div className="no-friends">
                    <p>Chưa có bạn bè nào</p>
                    <p>Thêm bạn bè từ trang chủ để bắt đầu chat!</p>
                </div>
            ) : (
                <div className="chat-items">
                    {filteredFriends.map((friend) => (
                        <div
                            key={friend.id || friend._id}
                            className={`chat-item ${selectedChatId === (friend.id || friend._id) ? 'active' : ''}`}
                            onClick={() => onSelectChat(friend)}
                        >
                            <div className="chat-avatar">
                                <img 
                                    src={friend.avatar || '/unnamed.jpg'}
                                    alt={formatUserName(friend)}
                                    onError={(e) => {
                                        e.target.src = '/unnamed.jpg';
                                    }}
                                />
                            </div>
                            
                            <div className="chat-info">
                                <div className="chat-header">
                                    <h4>{formatUserName(friend)}</h4>
                                </div>
                                
                                <div className="chat-preview">
                                    <p>Click để bắt đầu chat</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatList; 