import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import UserProfileCard from './UserProfileCard';
import { getPosts, getAllUsers } from '../utils/localStorage';

const UserProfile = ({ userId, currentUser, onBack, isDarkMode }) => {
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = () => {
      try {
        // Get user data
        const allUsers = getAllUsers();
        const foundUser = allUsers.find(u => u.id === userId);
        
        if (foundUser) {
          setUser(foundUser);
          
          // Get user's posts
          const allPosts = getPosts();
          const filteredPosts = allPosts.filter(post => post.author?.id === userId);
          setUserPosts(filteredPosts);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`user-profile-page ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`user-profile-page ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="error">User not found</div>
      </div>
    );
  }

  return (
    <div className={`user-profile-page ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <div className="profile-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1 className="profile-title">
          {user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.name || 'User Profile'}
        </h1>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        {/* Left Sidebar - Profile Card */}
        <div className="profile-sidebar">
          <UserProfileCard user={user} />
        </div>

        {/* Right Content - Posts */}
        <div className="profile-main">
          <div className="posts-section">
            <h2 className="posts-title">
              Posts by {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.name || 'User'}
            </h2>
            
            {userPosts.length > 0 ? (
              <div className="posts-list">
                {userPosts.map((post) => (
                  <div key={post.id} className="post-container">
                    <div className="post-item">
                      <div className="post-header">
                        <div className="post-author">
                          <div className="author-avatar">
                            {user.profilePicture ? (
                              <img 
                                src={user.profilePicture} 
                                alt={user.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <img 
                                src="/api/placeholder/32/32" 
                                alt={user.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            )}
                            <div className="avatar-fallback" style={{ display: user.profilePicture ? 'none' : 'flex' }}>
                              {user.firstName && user.lastName 
                                ? `${user.firstName[0]}${user.lastName[0]}` 
                                : user.name && typeof user.name === 'string' ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                            </div>
                          </div>
                          <div className="author-info">
                            <strong>
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.name || 'Unknown User'}
                            </strong>
                            <small>{formatDate(post.timestamp)}</small>
                          </div>
                        </div>
                      </div>
                      
                      <div className="post-content">
                        <p>{post.content}</p>
                      </div>
                      
                      {/* Post Attachments */}
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="post-attachments">
                          {post.attachments.map((attachment, attachIndex) => (
                            <div key={attachIndex} className="post-attachment">
                              {attachment.type === 'image' && attachment.preview && (
                                <div 
                                  className="attachment-image"
                                  onClick={() => window.open(attachment.preview, '_blank')}
                                  title="Click to view full size"
                                >
                                  <img src={attachment.preview} alt={attachment.name} />
                                </div>
                              )}
                              {attachment.type !== 'image' && (
                                <div className="attachment-file">
                                  <div className="attachment-icon">
                                    {attachment.type === 'video' && (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                      </svg>
                                    )}
                                    {attachment.type === 'audio' && (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                        <line x1="12" y1="19" x2="12" y2="23"></line>
                                        <line x1="8" y1="23" x2="16" y2="23"></line>
                                      </svg>
                                    )}
                                    {attachment.type === 'file' && (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                      </svg>
                                    )}
                                  </div>
                                  <div className="attachment-info">
                                    <div className="attachment-name">{attachment.name}</div>
                                    <div className="attachment-size">{attachment.size}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Post Actions */}
                      <div className="post-actions">
                        <button className="action-button">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                          {post.likes || 0}
                        </button>
                        <button className="action-button">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          {post.comments ? post.comments.length : 0}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-posts">
                <p>No posts yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
