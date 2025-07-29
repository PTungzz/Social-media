import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserProfileCard from './UserProfileCard';
import { authAPI, postsAPI } from '../services/api';
import './UserProfile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  const [userInfo, setUserInfo] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [showComments, setShowComments] = useState({});
  const [isDarkMode] = useState(
    document.body.classList.contains('dark-mode')
  );

  const handleGoBack = () => {
    navigate(-1); // Quay lại trang trước
  };

  // Handle like post
  const handleLikePost = async (postId) => {
    try {
      const response = await postsAPI.likePost(postId);
      if (response.data.success) {
        setUserPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { ...post, likes: response.data.likes, likesCount: response.data.likesCount }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Handle add comment
  const handleAddComment = async (postId) => {
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      const response = await postsAPI.addComment(postId, { content: commentText });
      if (response.data.success) {
        setUserPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { ...post, comments: response.data.comments }
              : post
          )
        );
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('🔍 Fetching user data for userId:', userId);
        
        // Fetch user info and posts in parallel - NO CACHE, NO LAZY LOADING
        const [userResponse, postsResponse] = await Promise.all([
          authAPI.getUserById(userId),
          postsAPI.getUserPosts(userId)
        ]);
        
        console.log('👤 User response:', userResponse.data);
        if (userResponse.data && userResponse.data.success) {
          setUserInfo(userResponse.data.user);
        }
        
        console.log('📝 Posts response:', postsResponse.data);
        if (postsResponse.data && postsResponse.data.success) {
          console.log('📊 Found posts:', postsResponse.data.posts.length);
          setUserPosts(postsResponse.data.posts);
        } else {
          console.log('❌ No posts found or request failed');
          setUserPosts([]);
        }

      } catch (error) {
        console.error('❌ Error fetching user data:', error);
        setError('Không thể tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className={`user-profile ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`user-profile ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="error">{error}</div>
        <button onClick={handleGoBack} className="back-btn">Quay lại</button>
      </div>
    );
  }

  return (
    <div className={`user-profile ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="user-profile-header">
        <button onClick={handleGoBack} className="back-btn">
          ← Quay lại
        </button>
        <h2>Trang cá nhân</h2>
      </div>

      <div className="user-profile-content">
        {/* UserProfileCard - 1/3 width */}
        <div className="user-profile-sidebar">
          <UserProfileCard 
            user={userInfo} 
            postsCount={userPosts.length}
            isDarkMode={isDarkMode}
            isOwnProfile={currentUser?.id === userId}
          />
        </div>

        {/* User Posts - 2/3 width */}
        <div className="user-posts-section">
          <div className="posts-header">
            <h3>Bài viết của {userInfo?.firstName} {userInfo?.lastName}</h3>
            <span className="posts-count">({userPosts.length} bài viết)</span>
          </div>

          <div className="posts-container">
            {userPosts.length === 0 ? (
              <div className="no-posts">
                <div className="no-posts-icon">📝</div>
                <p>Người dùng này chưa có bài viết nào.</p>
              </div>
            ) : (
              <div className="posts-list">
                {userPosts.map((post, index) => (
                  <div key={index} className="post-container">
                    <div className="post-item">
                      <div className="post-header">
                        <div className="post-author">
                          <div className="author-avatar">
                            {post.author?.avatar ? (
                              <img 
                                src={post.author.avatar} 
                                alt={userInfo?.firstName && userInfo?.lastName 
                                  ? `${userInfo.firstName} ${userInfo.lastName}` 
                                  : post.author?.firstName && post.author?.lastName 
                                    ? `${post.author.firstName} ${post.author.lastName}` 
                                    : 'User'}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <img 
                                src={userInfo?.avatar || "/api/placeholder/32/32"} 
                                alt={userInfo?.firstName && userInfo?.lastName 
                                  ? `${userInfo.firstName} ${userInfo.lastName}` 
                                  : 'User'}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            )}
                            <div className="avatar-fallback" style={{ display: post.author?.avatar ? 'none' : 'flex' }}>
                              {/* Use userInfo for fallback avatar text */}
                              {userInfo?.firstName && userInfo?.lastName 
                                ? `${userInfo.firstName[0]}${userInfo.lastName[0]}` 
                                : post.author?.firstName && post.author?.lastName 
                                  ? `${post.author.firstName[0]}${post.author.lastName[0]}` 
                                  : post.author?.username ? post.author.username[0].toUpperCase() 
                                  : userInfo?.username ? userInfo.username[0].toUpperCase() : 'U'}
                            </div>
                          </div>
                          <div className="author-info">
                            <strong className="author-name-clickable">
                              {/* Prioritize userInfo (current profile owner) over post.author data */}
                              {userInfo?.firstName && userInfo?.lastName 
                                ? `${userInfo.firstName} ${userInfo.lastName}` 
                                : post.author?.firstName && post.author?.lastName 
                                  ? `${post.author.firstName} ${post.author.lastName}` 
                                  : post.author?.username || userInfo?.username || 'User'}
                            </strong>
                            <small>{post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now'}</small>
                          </div>
                        </div>
                      </div>
                      
                      {post.content && (
                        <div className="post-content">
                          <p>{post.content}</p>
                        </div>
                      )}
                      
                      {post.image && (
                        <div className="post-attachments">
                          <div className="post-attachment">
                            <div 
                              className="attachment-image"
                              onClick={() => window.open(`http://localhost:5001${post.image}`, '_blank')}
                              title="Click to view full size"
                            >
                              <img src={`http://localhost:5001${post.image}`} alt="Post attachment" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Post Actions */}
                      <div className="post-actions">
                        <button 
                          className={`action-btn like-btn ${post.likes?.includes(currentUser?.id) ? 'liked' : ''}`}
                          onClick={() => handleLikePost(post._id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                          Like {post.likes?.length > 0 && `(${post.likes.length})`}
                        </button>
                        <button 
                          className="action-btn comment-btn"
                          onClick={() => toggleComments(post._id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          Comment {post.comments?.length > 0 && `(${post.comments.length})`}
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
                      {showComments[post._id] && (
                        <div className="comment-input-section">
                          <div className="comment-input">
                            <img 
                              src={currentUser?.avatar || "/api/placeholder/32/32"} 
                              alt={currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : 'You'}
                            />
                            <input
                              type="text"
                              placeholder="Viết bình luận..."
                              value={commentInputs[post._id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(post._id);
                                }
                              }}
                            />
                            <button 
                              onClick={() => handleAddComment(post._id)}
                              disabled={!commentInputs[post._id]?.trim()}
                            >
                              Gửi
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Comments List */}
                      {(showComments[post._id] || post.comments?.length > 0) && post.comments && post.comments.length > 0 && (
                        <div className="comments-list">
                          {post.comments.slice(0, 3).map((comment, commentIndex) => (
                            <div key={comment._id || comment.id || `comment-${commentIndex}`} className="comment-item">
                              <div className="comment-author">
                                <div className="comment-avatar">
                                  <img 
                                    src={comment.author?.avatar || "/api/placeholder/24/24"} 
                                    alt={comment.author?.firstName ? `${comment.author.firstName} ${comment.author.lastName}` : comment.author?.username || 'User'}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="avatar-fallback">
                                    {comment.author?.firstName && comment.author?.lastName 
                                      ? `${comment.author.firstName[0]}${comment.author.lastName[0]}` 
                                      : comment.author?.username ? comment.author.username[0].toUpperCase() : 'U'}
                                  </div>
                                </div>
                                <div className="comment-content">
                                  <div className="comment-bubble">
                                    <strong>
                                      {comment.author?.firstName && comment.author?.lastName 
                                        ? `${comment.author.firstName} ${comment.author.lastName}` 
                                        : comment.author?.username || 'Unknown User'}
                                    </strong>
                                    <p>{comment.content || comment.text}</p>
                                  </div>
                                  
                                  <div className="comment-meta">
                                    <small>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Just now'}</small>
                                    {comment.likes && comment.likes.length > 0 && (
                                      <span className="comment-likes">❤️ {comment.likes.length}</span>
                                    )}
                                  </div>

                                  {/* Display replies if any */}
                                  {comment.replies && comment.replies.length > 0 && (
                                    <div className="replies-container">
                                      {comment.replies.map((reply, replyIndex) => (
                                        <div key={reply._id || reply.id || `reply-${replyIndex}`} className="reply-item">
                                          <div className="reply-author">
                                            <div className="reply-avatar">
                                              <img 
                                                src={reply.author?.avatar || "/api/placeholder/20/20"} 
                                                alt={reply.author?.firstName ? `${reply.author.firstName} ${reply.author.lastName}` : reply.author?.username || 'User'}
                                                onError={(e) => {
                                                  e.target.style.display = 'none';
                                                  e.target.nextSibling.style.display = 'flex';
                                                }}
                                              />
                                              <div className="avatar-fallback">
                                                {reply.author?.firstName && reply.author?.lastName 
                                                  ? `${reply.author.firstName[0]}${reply.author.lastName[0]}` 
                                                  : reply.author?.username ? reply.author.username[0].toUpperCase() : 'U'}
                                              </div>
                                            </div>
                                            <div className="reply-content">
                                              <div className="reply-bubble">
                                                <strong>
                                                  {reply.author?.firstName && reply.author?.lastName 
                                                    ? `${reply.author.firstName} ${reply.author.lastName}` 
                                                    : reply.author?.username || 'Unknown User'}
                                                </strong>
                                                <p>{reply.text}</p>
                                              </div>
                                              <small>{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : 'Just now'}</small>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {post.comments.length > 3 && (
                            <div className="more-comments">
                              <span>Xem thêm {post.comments.length - 3} bình luận khác...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
