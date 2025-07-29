import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfileCard from './UserProfileCard';
import CreatePost from './CreatePost';
import { friendsAPI, chatAPI, authAPI, postsAPI } from '../services/api';
import { io } from 'socket.io-client';
import './HomePage.css';

const HomePage = ({ onLogout, user, isDarkMode, setIsDarkMode, onNavigateToChat }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [friends, setFriends] = useState([]); // Store complete friend objects from backend
  const [postLikes, setPostLikes] = useState({});
  const [userLikedPosts, setUserLikedPosts] = useState({}); // Track which posts user has liked
  const [postComments, setPostComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentLikes, setCommentLikes] = useState({}); // Track comment likes
  const [userLikedComments, setUserLikedComments] = useState({}); // Track which comments user has liked
  const [replyText, setReplyText] = useState({}); // Track reply input text
  const [showReplyInput, setShowReplyInput] = useState({}); // Track which comment reply input is shown
  const [editingReplyId, setEditingReplyId] = useState(null); // Track which reply is being edited
  const [editReplyText, setEditReplyText] = useState(''); // Track edit reply text
  const [posts, setPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0); // Track unread messages count
  const [socket, setSocket] = useState(null); // WebSocket connection
  
  // Search functionality states
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Load data from backend API on component mount
  useEffect(() => {
    const loadData = async () => {
      // Load posts from backend API
      if (user?.id || user?._id) {
        try {
          const postsResponse = await postsAPI.getPosts();
          if (postsResponse.data.success) {
            console.log('📝 Loaded posts from backend:', postsResponse.data.posts.length, 'posts');
            setPosts(postsResponse.data.posts);
            
            // Initialize post likes and comments from loaded posts
            const likes = {};
            const comments = {};
            const userLikes = {};
            const commentLikesData = {};
            const userLikedCommentsData = {};
            
            postsResponse.data.posts.forEach(post => {
              likes[post._id] = post.likes?.length || 0;
              comments[post._id] = post.comments || [];
              userLikes[post._id] = post.likes?.includes(user?.id || user?._id) || false;
              
              // Initialize comment likes from loaded data
              if (post.comments) {
                post.comments.forEach(comment => {
                  const commentId = comment._id || comment.id;
                  if (commentId) {
                    commentLikesData[commentId] = comment.likes ? comment.likes.length : 0;
                    userLikedCommentsData[commentId] = comment.likes ? 
                      comment.likes.includes(user?.id || user?._id) : false;
                  }
                });
              }
            });
            
            setPostLikes(likes);
            setPostComments(comments);
            setUserLikedPosts(userLikes);
            setCommentLikes(commentLikesData);
            setUserLikedComments(userLikedCommentsData);
          } else {
            setPosts([]);
          }
        } catch (error) {
          console.error('❌ Failed to load posts from backend:', error);
          setPosts([]);
        }
      }
      
      // Load friends from backend API only - no localStorage involvement
      if (user?.id || user?._id) {
        try {
          const response = await friendsAPI.getFriends();
          if (response.data.success) {
            // Store complete friend objects (not just IDs)
            setFriends(response.data.friends);
          } else {
            setFriends([]);
          }
        } catch (error) {
          console.error('❌ Failed to load friends from backend:', error);
          setFriends([]);
        }
      }
      
      // Load all users from backend API for search functionality
      try {
        const usersResponse = await authAPI.getAllUsers();
        if (usersResponse.data.success) {
          console.log('👥 Loaded users from backend:', usersResponse.data.users.length, 'users');
          setAllUsers(usersResponse.data.users);
        } else {
          console.log('⚠️ API failed');
          setAllUsers([]);
        }
      } catch (error) {
        console.error('❌ Failed to load users from backend:', error);
        setAllUsers([]);
      }
    };
    
    loadData();
    loadUnreadMessages();
  }, [user?.id]);

  // Load unread messages count
  const loadUnreadMessages = async () => {
    try {
      if (!user?.id && !user?._id) return;
      
      // Use real API to get unread messages count
      const response = await chatAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadMessages(response.data.count || 0);
      } else {
        // Fallback to localStorage for demo
        const storedUnread = localStorage.getItem(`unreadMessages_${user.id || user._id}`);
        setUnreadMessages(storedUnread ? parseInt(storedUnread) : 0);
      }
    } catch (error) {
      console.error('Failed to load unread messages:', error);
      // Fallback to localStorage
      const storedUnread = localStorage.getItem(`unreadMessages_${user.id || user._id}`);
      setUnreadMessages(storedUnread ? parseInt(storedUnread) : 0);
    }
  };

  // Function to update unread messages count
  const updateUnreadMessages = (count) => {
    setUnreadMessages(count);
    localStorage.setItem(`unreadMessages_${user.id || user._id}`, count.toString());
  };

  // Function to clear unread messages when user opens chat
  const clearUnreadMessages = async () => {
    try {
      setUnreadMessages(0);
      localStorage.removeItem(`unreadMessages_${user.id || user._id}`);
      
      // Mark all messages as read via API
      await chatAPI.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  // WebSocket connection for real-time messages
  useEffect(() => {
    if (!user?.id && !user?._id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize WebSocket connection
    const newSocket = io('http://localhost:5001', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('📡 Connected to WebSocket for notifications');
    });

    // Listen for new messages
    newSocket.on('new_message', (messageData) => {
      console.log('📩 New message received:', messageData);
      
      // Only increment if the message is not from current user
      if (messageData.senderId !== (user.id || user._id)) {
        setUnreadMessages(prev => {
          const newCount = prev + 1;
          localStorage.setItem(`unreadMessages_${user.id || user._id}`, newCount.toString());
          return newCount;
        });
      }
    });

    // Listen for message read events
    newSocket.on('messages_read', (data) => {
      console.log('✅ Messages marked as read:', data);
      if (data.userId === (user.id || user._id)) {
        setUnreadMessages(0);
        localStorage.removeItem(`unreadMessages_${user.id || user._id}`);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('📡 Disconnected from WebSocket');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user?.id, user?._id]);

  // Test function để demo unread messages (có thể xóa trong production)
  const simulateNewMessage = () => {
    const newCount = unreadMessages + 1;
    setUnreadMessages(newCount);
    localStorage.setItem(`unreadMessages_${user.id || user._id}`, newCount.toString());
  };

  // Add test button to check unread messages (development only)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'm') {
        simulateNewMessage();
        console.log('Simulated new message. Unread count:', unreadMessages + 1);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [unreadMessages]);

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
    if (searchQuery.trim()) {
      // Redirect to search results or implement full search
      console.log('Performing full search for:', searchQuery);
    }
  };

  // Handle search input change with real-time filtering
  const handleSearchInputChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      try {
        // Search through all users for matching names
        const filteredUsers = allUsers.filter(user => {
          const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
          const username = (user.username || '').toLowerCase();
          const searchTerm = query.toLowerCase();
          
          return fullName.includes(searchTerm) || username.includes(searchTerm);
        });

        // Limit to top 3 results
        const limitedResults = filteredUsers.slice(0, 3);
        setSearchResults(limitedResults);
        setShowSearchDropdown(limitedResults.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  // Handle clicking on a search result
  const handleSearchResultClick = (selectedUser) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
    
    // Navigate to user profile
    const userId = selectedUser._id || selectedUser.id;
    if (userId) {
      handleViewProfile(userId);
    } else {
      console.error('❌ No valid user ID found:', selectedUser);
    }
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        handleViewProfile(user.id);
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

  const handleCreatePost = async (newPost) => {
    try {
      console.log('🎯 Creating post:', newPost);
      console.log('🔑 User context:', user);
      
      const response = await postsAPI.createPost({
        content: newPost.content,
        image: newPost.image || null
      });
      
      console.log('📤 API Response:', response);
      
      if (response.data.success) {
        const savedPost = response.data.post;
        console.log('✅ New post created successfully:', savedPost);
        setPosts(prevPosts => [savedPost, ...prevPosts]);
        setPostLikes(prev => ({ ...prev, [savedPost._id]: 0 }));
        setPostComments(prev => ({ ...prev, [savedPost._id]: [] }));
        setUserLikedPosts(prev => ({ ...prev, [savedPost._id]: false }));
      } else {
        console.log('⚠️ API returned success=false:', response.data);
      }
    } catch (error) {
      console.error('❌ Failed to create post:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
    }
  };

  // Friend management functions
  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleAddFriend = async (friendData) => {
    if (!friendData || (!friendData.id && !friendData._id)) {
      console.error('Friend data is missing or invalid:', friendData);
      return;
    }
    
    if (!user || (!user.id && !user._id)) {
      console.error('Current user is missing or invalid:', user);
      return;
    }
    
    const friendId = friendData.id || friendData._id;
    const isCurrentlyFriend = isFriendCheck(friendId);
    
    try {
      if (isCurrentlyFriend) {
        // Remove friend from backend
        await friendsAPI.removeFriend(friendId);
        
        // Remove from local state
        setFriends(prevFriends => prevFriends.filter(f => (f._id || f.id) !== friendId));
      } else {
        // Add friend to backend
        const response = await friendsAPI.addFriend(friendId);
        if (response.data.success) {
          // Add complete friend object to local state
          setFriends(prevFriends => [...prevFriends, response.data.friend]);
        }
      }
    } catch (error) {
      console.error('❌ Error managing friend:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thao tác');
    }
  };

  const isFriendCheck = (friendId) => {
    return friends.some(friend => (friend._id || friend.id) === friendId);
  };

  // Like management functions
  const handleLike = async (postId) => {
    const isCurrentlyLiked = userLikedPosts[postId];
    
    try {
      if (isCurrentlyLiked) {
        // Unlike the post
        await postsAPI.unlikePost(postId);
      } else {
        // Like the post
        await postsAPI.likePost(postId);
      }
      
      // Update local state
      setUserLikedPosts(prev => ({
        ...prev,
        [postId]: !isCurrentlyLiked
      }));
      
      const newLikeCount = isCurrentlyLiked 
        ? Math.max(0, (postLikes[postId] || 0) - 1)
        : (postLikes[postId] || 0) + 1;
      
      setPostLikes(prevLikes => ({
        ...prevLikes,
        [postId]: newLikeCount
      }));
      
      console.log(`✅ Post ${isCurrentlyLiked ? 'unliked' : 'liked'} successfully`);
    } catch (error) {
      console.error('❌ Failed to toggle like:', error);
    }
  };

  // Comment management functions
  const handleCommentChange = (postId, text) => {
    setCommentText(prev => ({
      ...prev,
      [postId]: text
    }));
  };

  const handleEditComment = (commentId, currentContent) => {
    setEditingCommentId(commentId);
    setEditCommentText(currentContent || '');
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleSaveEditComment = async (postId, commentId) => {
    if (editCommentText && editCommentText.trim()) {
      try {
        const response = await postsAPI.updateComment(postId, commentId, {
          content: editCommentText.trim()
        });
        
        if (response.data.success) {
          // Update local state
          setPostComments(prev => ({
            ...prev,
            [postId]: prev[postId].map(comment => 
              (comment._id || comment.id) === commentId 
                ? { ...comment, content: editCommentText.trim(), text: editCommentText.trim() }
                : comment
            )
          }));
          
          setEditingCommentId(null);
          setEditCommentText('');
          console.log('✅ Comment updated successfully');
        }
      } catch (error) {
        console.error('❌ Failed to update comment:', error);
        alert('Failed to update comment. Please try again.');
      }
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const response = await postsAPI.deleteComment(postId, commentId);
        
        if (response.data.success) {
          // Update local state
          setPostComments(prev => ({
            ...prev,
            [postId]: prev[postId].filter(comment => 
              (comment._id || comment.id) !== commentId
            )
          }));
          
          console.log('✅ Comment deleted successfully');
        }
      } catch (error) {
        console.error('❌ Failed to delete comment:', error);
        alert('Failed to delete comment. Please try again.');
      }
    }
  };

  const handleLikeComment = async (postId, commentId) => {
    const isCurrentlyLiked = userLikedComments[commentId];
    
    try {
      let response;
      if (isCurrentlyLiked) {
        response = await postsAPI.unlikeComment(postId, commentId);
      } else {
        response = await postsAPI.likeComment(postId, commentId);
      }
      
      if (response.data.success) {
        // Update local state
        setUserLikedComments(prev => ({
          ...prev,
          [commentId]: !isCurrentlyLiked
        }));
        
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: response.data.likes
        }));
        
        // Update the comment in postComments to persist the like info
        setPostComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(comment => {
            if ((comment._id || comment.id) === commentId) {
              const updatedLikes = isCurrentlyLiked 
                ? (comment.likes || []).filter(id => id !== (user._id || user.id))
                : [...(comment.likes || []), (user._id || user.id)];
              return {
                ...comment,
                likes: updatedLikes
              };
            }
            return comment;
          })
        }));
        
        console.log(`✅ Comment ${isCurrentlyLiked ? 'unliked' : 'liked'} successfully`);
      }
    } catch (error) {
      console.error('❌ Failed to toggle comment like:', error);
    }
  };

  const handleReplyToComment = (commentId) => {
    setShowReplyInput(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleReplyTextChange = (commentId, text) => {
    setReplyText(prev => ({
      ...prev,
      [commentId]: text
    }));
  };

  const handleSubmitReply = async (postId, commentId) => {
    const text = replyText[commentId];
    if (text && text.trim()) {
      try {
        const response = await postsAPI.replyToComment(postId, commentId, { 
          content: text.trim() 
        });
        
        if (response.data.success) {
          // Create reply with complete author information (similar to comments)
          const replyWithCompleteAuthor = {
            _id: response.data.reply._id || response.data.reply.id || Date.now().toString(),
            content: response.data.reply.content || response.data.reply.text || text.trim(),
            text: response.data.reply.text || response.data.reply.content || text.trim(),
            createdAt: response.data.reply.createdAt || new Date().toISOString(),
            author: {
              _id: user._id || user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              avatar: user.avatar
            }
          };

          // Update local state with the new reply
          setPostComments(prev => ({
            ...prev,
            [postId]: prev[postId].map(comment => 
              (comment._id || comment.id) === commentId 
                ? { ...comment, replies: [...(comment.replies || []), replyWithCompleteAuthor] }
                : comment
            )
          }));
          
          setReplyText(prev => ({
            ...prev,
            [commentId]: ''
          }));
          
          setShowReplyInput(prev => ({
            ...prev,
            [commentId]: false
          }));
          
          console.log('✅ Reply added successfully');
        }
      } catch (error) {
        console.error('❌ Failed to add reply:', error);
      }
    }
  };

  const handleEditReply = (replyId, currentText) => {
    setEditingReplyId(replyId);
    setEditReplyText(currentText);
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditReplyText('');
  };

  const handleSaveEditReply = async (postId, commentId, replyId) => {
    if (editReplyText && editReplyText.trim()) {
      try {
        const response = await postsAPI.updateReply(postId, commentId, replyId, {
          content: editReplyText.trim()
        });
        
        if (response.data.success) {
          // Update local state
          setPostComments(prev => ({
            ...prev,
            [postId]: prev[postId].map(comment => 
              (comment._id || comment.id) === commentId 
                ? {
                    ...comment,
                    replies: comment.replies.map(reply =>
                      (reply._id || reply.id) === replyId
                        ? { ...reply, content: editReplyText.trim(), text: editReplyText.trim() }
                        : reply
                    )
                  }
                : comment
            )
          }));
          
          setEditingReplyId(null);
          setEditReplyText('');
          console.log('✅ Reply updated successfully');
        }
      } catch (error) {
        console.error('❌ Failed to update reply:', error);
        alert('Failed to update reply. Please try again.');
      }
    }
  };

  const handleDeleteReply = async (postId, commentId, replyId) => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        const response = await postsAPI.deleteReply(postId, commentId, replyId);
        
        if (response.data.success) {
          // Update local state
          setPostComments(prev => ({
            ...prev,
            [postId]: prev[postId].map(comment => 
              (comment._id || comment.id) === commentId 
                ? {
                    ...comment,
                    replies: comment.replies.filter(reply => 
                      (reply._id || reply.id) !== replyId
                    )
                  }
                : comment
            )
          }));
          
          console.log('✅ Reply deleted successfully');
        }
      } catch (error) {
        console.error('❌ Failed to delete reply:', error);
        alert('Failed to delete reply. Please try again.');
      }
    }
  };

  const handleSubmitComment = async (postId) => {
    const text = commentText[postId];
    if (text && text.trim()) {
      try {
        const response = await postsAPI.addComment(postId, { 
          content: text.trim() 
        });
        
        console.log('🔍 Full comment response:', response.data);
        
        if (response.data.success) {
          const newComment = response.data.comment;
          console.log('🔍 New comment from backend:', newComment);
          console.log('🔍 Comment author:', newComment?.author);
          console.log('🔍 Current user:', user);
          
          // Create comment with complete author information
          const commentWithCompleteAuthor = {
            _id: newComment._id || newComment.id || Date.now().toString(),
            content: newComment.content || newComment.text || text.trim(),
            text: newComment.text || newComment.content || text.trim(),
            createdAt: newComment.createdAt || new Date().toISOString(),
            likes: [], // Initialize empty likes array
            author: {
              _id: user._id || user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              avatar: user.avatar
            }
          };
          
          console.log('🔍 Comment with complete author:', commentWithCompleteAuthor);
          
          setPostComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), commentWithCompleteAuthor]
          }));
          
          // Initialize comment likes for new comment
          const newCommentId = commentWithCompleteAuthor._id;
          setCommentLikes(prev => ({
            ...prev,
            [newCommentId]: 0
          }));
          
          setUserLikedComments(prev => ({
            ...prev,
            [newCommentId]: false
          }));
          
          setCommentText(prev => ({
            ...prev,
            [postId]: ''
          }));
          
          console.log('✅ Comment added successfully');
        }
      } catch (error) {
        console.error('❌ Failed to add comment:', error);
      }
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
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
              
              {/* Search Results Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="search-dropdown">
                  <div className="search-results">
                    {searchResults.map((user) => (
                      <div
                        key={user._id || user.id}
                        className="search-result-item"
                        onClick={() => handleSearchResultClick(user)}
                      >
                        <div className="search-result-avatar">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={`${user.firstName || 'User'} ${user.lastName || ''}`}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div className="avatar-fallback">
                              {user.firstName && user.lastName 
                                ? `${user.firstName[0]}${user.lastName[0]}` 
                                : user.username ? user.username[0].toUpperCase() : 'U'}
                            </div>
                          )}
                        </div>
                        <div className="search-result-info">
                          <div className="search-result-name">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.username || 'Unknown User'}
                          </div>
                          {user.username && (user.firstName || user.lastName) && (
                            <div className="search-result-username">@{user.username}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Chat Button */}
          <button 
            className="icon-button chat-button"
            onClick={() => {
              clearUnreadMessages();
              onNavigateToChat();
            }}
            title="Messages"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {unreadMessages > 0 && (
              <span className="message-badge">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
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
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={`${user.firstName || 'User'} ${user.lastName || ''}`}
                    className="user-avatar-img"
                  />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
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
            <UserProfileCard user={user} onViewProfile={handleViewProfile} />
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
                                {post.author?.avatar ? (
                                  <img 
                                    src={post.author.avatar} 
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
                                <div className="avatar-fallback" style={{ display: post.author?.avatar ? 'none' : 'flex' }}>
                                  {post.author?.firstName && post.author?.lastName 
                                    ? `${post.author.firstName[0]}${post.author.lastName[0]}` 
                                    : post.author?.name && typeof post.author.name === 'string' ? post.author.name.split(' ').map(n => n[0]).join('') : 'U'}
                                </div>
                              </div>
                              <div className="author-info">
                                <strong 
                                  className="author-name-clickable"
                                  onClick={() => (post.author?._id || post.author?.id) && handleViewProfile(post.author._id || post.author.id)}
                                >
                                  {post.author?.firstName && post.author?.lastName 
                                    ? `${post.author.firstName} ${post.author.lastName}` 
                                    : post.author?.name || 'Unknown User'}
                                </strong>
                                <small>{post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now'}</small>
                              </div>
                            </div>
                            
                            {/* Add Friend Button */}
                            {(post.author?._id || post.author?.id) && (post.author._id || post.author.id) !== (user?._id || user?.id) && (
                              <button
                                className={`friend-btn ${isFriendCheck(post.author._id || post.author.id) ? 'remove-friend' : 'add-friend'}`}
                                onClick={() => handleAddFriend(post.author)}
                                title={isFriendCheck(post.author._id || post.author.id) ? 'Remove Friend' : 'Add Friend'}
                              >
                                {isFriendCheck(post.author._id || post.author.id) ? (
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
                              className={`action-btn like-btn ${userLikedPosts[post._id] ? 'liked' : ''}`}
                              onClick={() => handleLike(post._id)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                              </svg>
                              {userLikedPosts[post._id] ? 'Unlike' : 'Like'} {postLikes[post._id] > 0 && `(${postLikes[post._id]})`}
                            </button>
                            <button className="action-btn comment-btn">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                              </svg>
                              Comment {(postComments[post._id]?.length || 0) > 0 && `(${postComments[post._id].length})`}
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
                          
                          {/* Comment Input - Always visible */}
                          <div className="comment-input-container">
                            <div className="comment-input-wrapper">
                              <input
                                type="text"
                                placeholder="Write a comment..."
                                value={commentText[post._id] || ''}
                                onChange={(e) => handleCommentChange(post._id, e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(post._id)}
                                className="comment-input"
                              />
                              <button
                                onClick={() => handleSubmitComment(post._id)}
                                className="comment-send-btn"
                                                                              disabled={!commentText[post._id] || !commentText[post._id].trim()}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="22" y1="2" x2="11" y2="13"></line>
                                  <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {/* Comments List */}
                          {postComments[post._id]?.length > 0 && (
                            <div className="comments-list">
                              {postComments[post._id].map((comment, commentIndex) => (
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
                                        
                                        {/* Edit mode or display mode */}
                                        {editingCommentId === (comment._id || comment.id) ? (
                                          <div className="edit-comment-container">
                                            <input
                                              type="text"
                                              value={editCommentText || ''}
                                              onChange={(e) => setEditCommentText(e.target.value)}
                                              onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                  handleSaveEditComment(post._id, comment._id || comment.id);
                                                } else if (e.key === 'Escape') {
                                                  handleCancelEditComment();
                                                }
                                              }}
                                              className="edit-comment-input"
                                              autoFocus
                                            />
                                            <div className="edit-comment-actions">
                                              <button
                                                onClick={() => handleSaveEditComment(post._id, comment._id || comment.id)}
                                                className="save-edit-btn"
                                                disabled={!editCommentText || !editCommentText.trim()}
                                              >
                                                Save
                                              </button>
                                              <button
                                                onClick={handleCancelEditComment}
                                                className="cancel-edit-btn"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p>{comment.content || comment.text}</p>
                                        )}
                                      </div>
                                      
                                      <div className="comment-meta">
                                        {/* Show edit/delete buttons only for current user's comments */}
                                        {(comment.author?._id || comment.author?.id) === (user?._id || user?.id) && (
                                          <div className="comment-actions">
                                            <button
                                              onClick={() => handleEditComment(comment._id || comment.id, comment.content || comment.text || '')}
                                              className="edit-comment-btn"
                                              title="Edit comment"
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                              </svg>
                                              <span>Edit</span>
                                            </button>
                                            <button
                                              onClick={() => handleDeleteComment(post._id, comment._id || comment.id)}
                                              className="delete-comment-btn"
                                              title="Delete comment"
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3,6 5,6 21,6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                              </svg>
                                              <span>Delete</span>
                                            </button>
                                          </div>
                                        )}
                                        
                                        {/* Show like/reply buttons for other users' comments */}
                                        {(comment.author?._id || comment.author?.id) !== (user?._id || user?.id) && (
                                          <div className="comment-interactions">
                                            <button
                                              onClick={() => handleLikeComment(post._id, comment._id || comment.id)}
                                              className={`like-comment-btn ${userLikedComments[comment._id || comment.id] ? 'liked' : ''}`}
                                              title={userLikedComments[comment._id || comment.id] ? 'Unlike comment' : 'Like comment'}
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill={userLikedComments[comment._id || comment.id] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                              </svg>
                                              <span>Like</span>
                                              {commentLikes[comment._id || comment.id] > 0 && (
                                                <span className="like-count">({commentLikes[comment._id || comment.id]})</span>
                                              )}
                                            </button>
                                            <button
                                              onClick={() => handleReplyToComment(comment._id || comment.id)}
                                              className="reply-comment-btn"
                                              title="Reply to comment"
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                                              </svg>
                                              <span>Reply</span>
                                            </button>
                                          </div>
                                        )}
                                        
                                        <small>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Just now'}</small>
                                      </div>

                                      {/* Reply input for other users' comments */}
                                      {(comment.author?._id || comment.author?.id) !== (user?._id || user?.id) && 
                                       showReplyInput[comment._id || comment.id] && (
                                        <div className="reply-input-container">
                                          <input
                                            type="text"
                                            value={replyText[comment._id || comment.id] || ''}
                                            onChange={(e) => handleReplyTextChange(comment._id || comment.id, e.target.value)}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter' && replyText[comment._id || comment.id]?.trim()) {
                                                handleSubmitReply(post._id, comment._id || comment.id);
                                              }
                                            }}
                                            placeholder="Write a reply..."
                                            className="reply-input"
                                            autoFocus
                                          />
                                          <div className="reply-actions">
                                            <button
                                              onClick={() => handleSubmitReply(post._id, comment._id || comment.id)}
                                              className="submit-reply-btn"
                                              disabled={!replyText[comment._id || comment.id]?.trim()}
                                            >
                                              Reply
                                            </button>
                                            <button
                                              onClick={() => handleReplyToComment(comment._id || comment.id)}
                                              className="cancel-reply-btn"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}

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
                                                    
                                                    {/* Edit mode or display mode for reply */}
                                                    {editingReplyId === (reply._id || reply.id) ? (
                                                      <div className="edit-reply-container">
                                                        <input
                                                          type="text"
                                                          value={editReplyText || ''}
                                                          onChange={(e) => setEditReplyText(e.target.value)}
                                                          onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                              handleSaveEditReply(post._id, comment._id || comment.id, reply._id || reply.id);
                                                            } else if (e.key === 'Escape') {
                                                              handleCancelEditReply();
                                                            }
                                                          }}
                                                          className="edit-reply-input"
                                                          autoFocus
                                                        />
                                                        <div className="edit-reply-actions">
                                                          <button
                                                            onClick={() => handleSaveEditReply(post._id, comment._id || comment.id, reply._id || reply.id)}
                                                            className="save-edit-btn"
                                                            disabled={!editReplyText || !editReplyText.trim()}
                                                          >
                                                            Save
                                                          </button>
                                                          <button
                                                            onClick={handleCancelEditReply}
                                                            className="cancel-edit-btn"
                                                          >
                                                            Cancel
                                                          </button>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <p>{reply.content || reply.text}</p>
                                                    )}
                                                  </div>
                                                  
                                                  <div className="reply-meta">
                                                    {/* Show edit/delete buttons only for current user's replies */}
                                                    {(reply.author?._id || reply.author?.id) === (user?._id || user?.id) && (
                                                      <div className="reply-actions">
                                                        <button
                                                          onClick={() => handleEditReply(reply._id || reply.id, reply.content || reply.text || '')}
                                                          className="edit-reply-btn"
                                                          title="Edit reply"
                                                        >
                                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                          </svg>
                                                          <span>Edit</span>
                                                        </button>
                                                        <button
                                                          onClick={() => handleDeleteReply(post._id, comment._id || comment.id, reply._id || reply.id)}
                                                          className="delete-reply-btn"
                                                          title="Delete reply"
                                                        >
                                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3,6 5,6 21,6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                          </svg>
                                                          <span>Delete</span>
                                                        </button>
                                                      </div>
                                                    )}

                                                    {/* Show like/reply buttons for other users' replies */}
                                                    {(reply.author?._id || reply.author?.id) !== (user?._id || user?.id) && (
                                                      <div className="reply-interactions">
                                                        <button
                                                          onClick={() => handleReplyToComment(comment._id || comment.id)}
                                                          className="reply-to-reply-btn"
                                                          title="Reply to this reply"
                                                        >
                                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                                                          </svg>
                                                          <span>Reply</span>
                                                        </button>
                                                      </div>
                                                    )}
                                                    
                                                    <small>{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : 'Just now'}</small>
                                                  </div>
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
                  {friends.map((friend) => {
                    return (
                      <div key={friend._id || friend.id} className="friend-item">
                        <div className="friend-avatar">
                          {friend.avatar ? (
                            <img 
                              src={friend.avatar} 
                              alt={friend.firstName ? `${friend.firstName} ${friend.lastName}` : friend.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <img 
                              src="/api/placeholder/32/32" 
                              alt={friend.firstName ? `${friend.firstName} ${friend.lastName}` : friend.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          )}
                          <div className="avatar-fallback" style={{ display: friend.avatar ? 'none' : 'flex' }}>
                            {friend.firstName && friend.lastName 
                              ? `${friend.firstName[0]}${friend.lastName[0]}` 
                              : friend.name && typeof friend.name === 'string' ? friend.name.split(' ').map(n => n[0]).join('') : 'U'}
                          </div>
                        </div>
                        <span className="friend-name">
                          {friend.firstName && friend.lastName 
                            ? `${friend.firstName} ${friend.lastName}` 
                            : friend.name || 'Unknown User'}
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
