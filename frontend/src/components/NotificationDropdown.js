import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import './NotificationDropdown.css';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications();
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationText = (notification) => {
    const senderName = notification.sender?.firstName 
      ? `${notification.sender.firstName} ${notification.sender.lastName}`
      : notification.sender?.username || 'Someone';
    
    return `${senderName} ${notification.message}`;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMinutes = Math.floor((now - notifDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="mark-all-read-btn">
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="notification-list">
        {loading ? (
          <div className="notification-loading">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">No notifications yet</div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification._id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-avatar">
                {notification.sender?.avatar ? (
                  <img 
                    src={notification.sender.avatar} 
                    alt="Avatar"
                    className="avatar-img"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {notification.sender?.firstName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              
              <div className="notification-content">
                <div className="notification-text">
                  {getNotificationText(notification)}
                </div>
                <div className="notification-time">
                  {getTimeAgo(notification.createdAt)}
                </div>
              </div>
              
              {notification.type === 'like' && (
                <div className="notification-icon like-icon">❤️</div>
              )}
              {notification.type === 'comment' && (
                <div className="notification-icon comment-icon">💬</div>
              )}
              {notification.type === 'reply' && (
                <div className="notification-icon reply-icon">↩️</div>
              )}
              {notification.type === 'friend_accept' && (
                <div className="notification-icon friend-icon">👥</div>
              )}
              
              {!notification.isRead && (
                <div className="unread-indicator"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
