import React, { useState, useEffect } from 'react';
import UserProfileCard from './UserProfileCard';
import CreatePost from './CreatePost';
import './HomePage.css';
import { 
  getPosts, 
  addPost, 
  updatePost, 
  getFriends, 
  addFriend, 
  removeFriend, 
  getAllUsers 
} from '../utils/localStorage';

const HomePage = ({ onLogout, user, isDarkMode, setIsDarkMode, onViewProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [friends, setFriends] = useState([]);
  const [postLikes, setPostLikes] = useState({});
  const [userLikedPosts, setUserLikedPosts] = useState({}); // Track which posts user has liked
  const [postComments, setPostComments] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({});
  const [commentText, setCommentText] = useState({});
  const [posts, setPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadedPosts = getPosts();
    const loadedFriends = getFriends(user?.id);
    const loadedUsers = getAllUsers();
    
    setPosts(loadedPosts);
    setFriends(loadedFriends);
    setAllUsers(loadedUsers);
    
    // Initialize post likes and comments from loaded posts
    const likes = {};
    const comments = {};
    const userLikes = {};
    
    loadedPosts.forEach(post => {
      likes[post.id] = post.likes || 0;
      comments[post.id] = post.comments || [];
      userLikes[post.id] = post.likedBy?.includes(user?.id) || false;
    });
    
    setPostLikes(likes);
    setPostComments(comments);
    setUserLikedPosts(userLikes);
  }, [user?.id]);

  const notifications = [
    {
      id: 1,
      type: 'friend_request',
      message: 'John Doe sent you a friend request',
      time: '2 hours ago',
      isUnread: true
    },
    {
      id: 2,
      type: 'like',
      message: 'Sarah liked your post',
      time: '4 hours ago',
      isUnread: true
    },
    {
      id: 3,
      type: 'comment',
      message: 'Mike commented on your post',
      time: '6 hours ago',
      isUnread: false
    },
    {
      id: 4,
      type: 'share',
      message: 'Alex shared your post',
      time: '1 day ago',
      isUnread: false
    }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // TODO: Implement search functionality
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
  };

  const handleProfileAction = (action) => {
    setShowProfileMenu(false);
    switch(action) {
      case 'view':
        onViewProfile(user.id);
        break;
      case 'edit':
        console.log('Edit profile');
        break;
      case 'logout':
        onLogout();
        break;
      default:
        break;
    }
  };

  const handleCreatePost = (newPost) => {
    const savedPost = addPost({
      ...newPost,
      author: user
    });
    
    if (savedPost) {
      setPosts(prevPosts => [savedPost, ...prevPosts]);
      setPostLikes(prev => ({ ...prev, [savedPost.id]: 0 }));
      setPostComments(prev => ({ ...prev, [savedPost.id]: [] }));
      setUserLikedPosts(prev => ({ ...prev, [savedPost.id]: false }));
      console.log('New post created:', savedPost);
    }
  };

  // Friend management functions
  const handleAddFriend = (friendData) => {
    if (!friendData || !friendData.id) {
      console.error('Friend data is missing or invalid:', friendData);
      return;
    }
    
    if (!user || !user.id) {
      console.error('Current user is missing or invalid:', user);
      return;
    }
    
    const isCurrentlyFriend = isFriendCheck(friendData.id);
    
    if (isCurrentlyFriend) {
      // Remove friend
      removeFriend(user.id, friendData.id);
      setFriends(prevFriends => prevFriends.filter(f => f !== friendData.id));
    } else {
      // Add friend
      addFriend(user.id, friendData.id);
      setFriends(prevFriends => [...prevFriends, friendData.id]);
    }
  };

  const isFriendCheck = (friendId) => {
    return friends.includes(friendId);
  };

  // Like management functions
  const handleLike = (postId) => {
    const isCurrentlyLiked = userLikedPosts[postId];
    
    setUserLikedPosts(prev => ({
      ...prev,
      [postId]: !isCurrentlyLiked
    }));
    
    const newLikeCount = isCurrentlyLiked 
      ? Math.max(0, (postLikes[postId] || 0) - 1) // Unlike: decrease by 1, but don't go below 0
      : (postLikes[postId] || 0) + 1; // Like: increase by 1
    
    setPostLikes(prevLikes => ({
      ...prevLikes,
      [postId]: newLikeCount
    }));
    
    // Update post in localStorage
    const currentPost = posts.find(p => p.id === postId);
    if (currentPost) {
      const updatedLikedBy = isCurrentlyLiked 
        ? currentPost.likedBy?.filter(id => id !== user?.id) || []
        : [...(currentPost.likedBy || []), user?.id];
      
      updatePost(postId, {
        likes: newLikeCount,
        likedBy: updatedLikedBy
      });
    }
  };

  // Comment management functions
  const handleToggleComment = (postId) => {
    setShowCommentInput(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentChange = (postId, text) => {
    setCommentText(prev => ({
      ...prev,
      [postId]: text
    }));
  };

  const handleSubmitComment = (postId) => {
    const text = commentText[postId];
    if (text && text.trim()) {
      const newComment = {
        id: Date.now(),
        text: text.trim(),
        author: user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user?.name || 'Anonymous',
        timestamp: new Date()
      };
      
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      
      // Update post in localStorage
      const currentPost = posts.find(p => p.id === postId);
      if (currentPost) {
        const updatedComments = [...(currentPost.comments || []), newComment];
        updatePost(postId, {
          comments: updatedComments
        });
      }
      
      setCommentText(prev => ({
        ...prev,
        [postId]: ''
      }));
      setShowCommentInput(prev => ({
        ...prev,
        [postId]: false
      }));
    }
  };

  return (
    <div className={`home-page ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <h1 className="logo">Sociopedia</h1>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>

        <div className="top-bar-right">
          {/* Dark Mode Toggle */}
          <button 
            className="icon-button dark-mode-toggle"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {/* Notifications */}
          <div className="dropdown-container">
            <button 
              className="icon-button notification-button"
              onClick={toggleNotifications}
              title="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.filter(n => n.isUnread).length > 0 && (
                <span className="notification-badge">
                  {notifications.filter(n => n.isUnread).length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="dropdown-menu notifications-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                </div>
                <div className="notifications-list">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.isUnread ? 'unread' : ''}`}
                    >
                      <div className="notification-content">
                        <span className="notification-message">{notification.message}</span>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                      {notification.isUnread && <div className="unread-dot"></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="dropdown-container">
            <button 
              className="icon-button profile-button"
              onClick={toggleProfileMenu}
              title="Profile Menu"
            >
              <div className="profile-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>

            {showProfileMenu && (
              <div className="dropdown-menu profile-dropdown">
                <button 
                  className="dropdown-item"
                  onClick={() => handleProfileAction('view')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  View Profile
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleProfileAction('edit')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Profile
                </button>
                <hr className="dropdown-divider" />
                <button 
                  className="dropdown-item logout-item"
                  onClick={() => handleProfileAction('logout')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16,17 21,12 16,7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-layout">
          {/* Left Sidebar */}
          <div className="left-sidebar">
            <UserProfileCard user={user} onViewProfile={onViewProfile} />
          </div>
          
          {/* Main Feed */}
          <div className="main-feed">
            {/* Create Post Section */}
            <div className="create-post-section">
              <CreatePost 
                user={user} 
                onCreatePost={handleCreatePost} 
                isDarkMode={isDarkMode} 
              />
            </div>
            
            {/* News Feed Section */}
            <div className="news-feed-section">
              <div className="news-feed-container">
                {posts.length > 0 ? (
                  <div className="posts-list">
                    {posts.map((post, index) => (
                      <div key={index} className="post-container">
                        <div className="post-item">
                          <div className="post-header">
                            <div className="post-author">
                              <div className="author-avatar">
                                {post.author?.profilePicture ? (
                                  <img 
                                    src={post.author.profilePicture} 
                                    alt={post.author?.firstName ? `${post.author.firstName} ${post.author.lastName}` : 'User'}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : (
                                  <img 
                                    src="/api/placeholder/32/32" 
                                    alt={post.author?.firstName ? `${post.author.firstName} ${post.author.lastName}` : 'User'}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                )}
                                <div className="avatar-fallback" style={{ display: post.author?.profilePicture ? 'none' : 'flex' }}>
                                  {post.author?.firstName && post.author?.lastName 
                                    ? `${post.author.firstName[0]}${post.author.lastName[0]}` 
                                    : post.author?.name && typeof post.author.name === 'string' ? post.author.name.split(' ').map(n => n[0]).join('') : 'U'}
                                </div>
                              </div>
                              <div className="author-info">
                                <strong 
                                  className="author-name-clickable"
                                  onClick={() => post.author?.id && onViewProfile(post.author.id)}
                                >
                                  {post.author?.firstName && post.author?.lastName 
                                    ? `${post.author.firstName} ${post.author.lastName}` 
                                    : post.author?.name || 'Unknown User'}
                                </strong>
                                <small>{new Date(post.timestamp).toLocaleString()}</small>
                              </div>
                            </div>
                            
                            {/* Add Friend Button */}
                            {post.author?.id && post.author.id !== user?.id && (
                              <button
                                className={`friend-btn ${isFriendCheck(post.author.id) ? 'remove-friend' : 'add-friend'}`}
                                onClick={() => handleAddFriend(post.author)}
                                title={isFriendCheck(post.author.id) ? 'Remove Friend' : 'Add Friend'}
                              >
                                {isFriendCheck(post.author.id) ? (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                  </svg>
                                ) : (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                          
                          {post.content && (
                            <div className="post-content">
                              <p>{post.content}</p>
                            </div>
                          )}
                          
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
                                        <span className="attachment-name">{attachment.name}</span>
                                        <span className="attachment-size">
                                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Post Actions */}
                          <div className="post-actions">
                            <button 
                              className={`action-btn like-btn ${userLikedPosts[post.id] ? 'liked' : ''}`}
                              onClick={() => handleLike(post.id)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                              </svg>
                              {userLikedPosts[post.id] ? 'Unlike' : 'Like'} {postLikes[post.id] > 0 && `(${postLikes[post.id]})`}
                            </button>
                            <button 
                              className="action-btn comment-btn"
                              onClick={() => handleToggleComment(post.id)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                              </svg>
                              Comment {(postComments[post.id]?.length || 0) > 0 && `(${postComments[post.id].length})`}
                            </button>
                            <button className="action-btn share-btn">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                              </svg>
                              Share
                            </button>
                          </div>
                          
                          {/* Comment Input */}
                          {showCommentInput[post.id] && (
                            <div className="comment-input-container">
                              <div className="comment-input-wrapper">
                                <input
                                  type="text"
                                  placeholder="Write a comment..."
                                  value={commentText[post.id] || ''}
                                  onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                  className="comment-input"
                                />
                                <button
                                  onClick={() => handleSubmitComment(post.id)}
                                  className="comment-send-btn"
                                  disabled={!commentText[post.id]?.trim()}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Comments List */}
                          {postComments[post.id]?.length > 0 && (
                            <div className="comments-list">
                              {postComments[post.id].map((comment) => (
                                <div key={comment.id} className="comment-item">
                                  <div className="comment-author">
                                    <div className="comment-avatar">
                                      <img 
                                        src="/api/placeholder/24/24" 
                                        alt={comment.author}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                      <div className="avatar-fallback">
                                        {comment.author && typeof comment.author === 'string' ? comment.author.split(' ').map(n => n[0]).join('') : 'U'}
                                      </div>
                                    </div>
                                    <div className="comment-content">
                                      <div className="comment-bubble">
                                        <strong>{comment.author}</strong>
                                        <p>{comment.text}</p>
                                      </div>
                                      <small>{comment.timestamp.toLocaleString()}</small>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-posts">
                    <p>No posts yet. Create your first post!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="right-sidebar">
            <div className="sidebar-widget">
              <h3>Sponsored</h3>
              <p>Advertisement content will go here.</p>
            </div>
            <div className="sidebar-widget">
              <h3>Friend List</h3>
              {friends.length > 0 ? (
                <div className="friends-list">
                  {friends.map((friendId) => {
                    const friendUser = allUsers.find(u => u.id === friendId);
                    if (!friendUser) return null;
                    
                    return (
                      <div key={friendId} className="friend-item">
                        <div className="friend-avatar">
                          {friendUser.profilePicture ? (
                            <img 
                              src={friendUser.profilePicture} 
                              alt={friendUser.firstName ? `${friendUser.firstName} ${friendUser.lastName}` : friendUser.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <img 
                              src="/api/placeholder/32/32" 
                              alt={friendUser.firstName ? `${friendUser.firstName} ${friendUser.lastName}` : friendUser.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          )}
                          <div className="avatar-fallback" style={{ display: friendUser.profilePicture ? 'none' : 'flex' }}>
                            {friendUser.firstName && friendUser.lastName 
                              ? `${friendUser.firstName[0]}${friendUser.lastName[0]}` 
                              : friendUser.name && typeof friendUser.name === 'string' ? friendUser.name.split(' ').map(n => n[0]).join('') : 'U'}
                          </div>
                        </div>
                        <span className="friend-name">
                          {friendUser.firstName && friendUser.lastName 
                            ? `${friendUser.firstName} ${friendUser.lastName}` 
                            : friendUser.name || 'Unknown User'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No friends added yet. Add friends from posts!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
