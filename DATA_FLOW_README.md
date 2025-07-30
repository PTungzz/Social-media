# Social Media Platform - Data Flow & Features Documentation

Tài liệu chi tiết về luồng dữ liệu và implementation của từng tính năng trong ứng dụng Social Media.

## 📋 Mục lục

- [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Data Flow chi tiết](#data-flow-chi-tiết)
- [Tính năng và Implementation](#tính-năng-và-implementation)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Security & Performance](#security--performance)

## 🎯 Tổng quan kiến trúc

Ứng dụng Social Media được xây dựng theo kiến trúc Client-Server với các tính năng:
- **Authentication System** với JWT
- **Real-time Chat** với Socket.IO
- **Post Management** với file upload
- **Friend System** với 2-way relationships
- **Notification System** giống Facebook
- **User Profile** với posts display

## 🛠️ Công nghệ sử dụng

### Frontend Stack
- **React.js 18** - Component-based UI
- **React Router** - Client-side routing
- **Axios** - HTTP requests với interceptors
- **CSS3** - Responsive styling
- **Socket.IO Client** - Real-time communication

### Backend Stack
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework (ES6 modules)
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Token-based authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload middleware
- **Socket.IO** - WebSocket server
- **Joi** - Input validation

## 📁 Cấu trúc thư mục với số dòng code

```
Social-media/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomePage.js          # 1524 dòng - Main dashboard
│   │   │   ├── UserProfile.js       # 353 dòng - Profile page
│   │   │   ├── UserProfileCard.js   # 125 dòng - Profile sidebar
│   │   │   ├── ChatList.js          # ~200 dòng - Chat interface
│   │   │   ├── NotificationDropdown.js # ~150 dòng - Notification UI
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.js               # 122 dòng - API client
│   │   └── App.js
├── backend/
│   ├── controllers/
│   │   ├── authController.js        # 197 dòng - Authentication
│   │   ├── postController.js        # 405 dòng - Posts CRUD
│   │   ├── chatController.js        # ~150 dòng - Chat logic
│   │   ├── friendController.js      # 159 dòng - Friends system
│   │   └── notificationController.js # ~100 dòng - Notifications
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── BlogPost.js              # Post schema với comments
│   │   ├── ChatMessage.js           # Chat schema
│   │   ├── Friend.js                # Friend relationship
│   │   └── Notification.js          # Notification schema
│   ├── routes/ & middlewares/ & websocket/
│   └── server.js                    # Main server
└── uploads/                         # File storage
```

## 🔄 Data Flow chi tiết

## 1. 🔐 Authentication Flow

### Registration Flow
```
Frontend (App.js) → API Call → Backend (authController.js dòng 8-55)
    ↓
Input Validation (Joi) → Check Existing User → Hash Password (bcrypt)
    ↓
Save to MongoDB → Generate JWT Token → Return User + Token
    ↓
Frontend stores token in localStorage → Redirect to HomePage
```

**Code Implementation:**

**Backend:** `authController.js` (dòng 8-55)
```javascript
export const register = async (req, res) => {
    // Validation với Joi (dòng 13-16)
    const { error } = registerValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    
    // Check user existence (dòng 18-23)
    const existingUser = await User.findOne({ 
        $or: [{ email: req.body.email }, { username: req.body.username }] 
    });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    
    // Hash password (dòng 27-28)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
    // Create user (dòng 30-38)
    const user = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
        location: req.body.location || '',
        occupation: req.body.occupation || '',
        avatar: req.body.avatar || ''
    });
    
    const savedUser = await user.save();
    
    // Generate JWT (dòng 43-46)
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
        success: true,
        token,
        user: { /* user data without password */ }
    });
}
```

### Authentication Middleware
**File:** `authMiddleware.js` (toàn bộ file)
```javascript
export const protect = async (req, res, next) => {
    // Extract token từ Authorization header (dòng 6-12)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    try {
        // Verify JWT token (dòng 15-20)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
}
```

## 2. 📝 Post Creation & Display Flow

### Create Post Flow
```
HomePage.js (dòng 357-394) → FormData with image → API Call
    ↓
Multer middleware → postController.js (dòng 8-43) → Save to MongoDB
    ↓
Populate author info → Return post data → Update Frontend state
    ↓
Re-render news feed với post mới
```

**Code Implementation:**

**Frontend:** `HomePage.js` (dòng 357-394)
```javascript
const handleCreatePost = async (newPost) => {
    try {
        // Prepare FormData cho file upload (dòng 360-370)
        const formData = new FormData();
        formData.append('content', newPost.content);
        if (newPost.image) {
            formData.append('image', newPost.image);
        }
        
        console.log('🔗 Creating post:', newPost);
        
        // API call (dòng 375-385)
        const response = await postsAPI.createPost(formData);
        
        if (response.data.success) {
            // Update UI state immediately (dòng 380-390)
            setPosts(prevPosts => [response.data.post, ...prevPosts]);
            setPostContent('');
            setSelectedImage(null);
            setImagePreview(null);
            
            console.log('✅ Post created successfully');
        }
    } catch (error) {
        console.error('❌ Error creating post:', error);
    }
};
```

**Backend:** `postController.js` (dòng 8-43)
```javascript
export const createPost = async (req, res) => {
    try {
        console.log('📝 Creating new post');
        console.log('👤 Author ID:', req.user.id);
        console.log('📄 Content:', req.body.content);
        
        // Handle image upload với multer (dòng 12-13)
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        console.log('🖼️ Image path:', imagePath);
        
        // Create new post (dòng 15-22)
        const newPost = new BlogPost({
            content: req.body.content,
            author: req.user.id,
            image: imagePath,
            likes: [],
            comments: []
        });
        
        // Save và populate (dòng 24-30)
        const savedPost = await newPost.save();
        await savedPost.populate('author', 'username firstName lastName avatar');
        
        console.log('✅ Post saved successfully');
        
        res.status(201).json({
            success: true,
            post: {
                ...savedPost._doc,
                createdAt: savedPost.createdAt.toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Create post error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
```

### News Feed Display Flow
```
HomePage.js useEffect → API Call → postController.js getPosts (dòng 45-60)
    ↓
Query MongoDB với populate → Return posts array → Frontend render
    ↓
Map through posts → Display với author info, content, image, actions
```

**Frontend:** `HomePage.js` (dòng 80-120 + 1070-1200)
```javascript
// Fetch posts (dòng 80-120)
useEffect(() => {
    const fetchPosts = async () => {
        try {
            console.log('📊 Fetching posts...');
            const response = await postsAPI.getPosts();
            
            if (response.data.success) {
                setPosts(response.data.posts);
                console.log('✅ Posts loaded:', response.data.posts.length);
            }
        } catch (error) {
            console.error('❌ Error fetching posts:', error);
        }
    };
    
    fetchPosts();
}, []);

// Render posts (dòng 1070-1200)
{posts.map(post => (
    <div key={post._id} className="post-item">
        <div className="post-header">
            <div className="post-author">
                <img 
                    src={post.author?.avatar || "/api/placeholder/40/40"} 
                    alt={post.author?.firstName ? `${post.author.firstName} ${post.author.lastName}` : 'User'}
                />
                <div className="author-info">
                    <strong>{post.author?.firstName} {post.author?.lastName}</strong>
                    <small>{new Date(post.createdAt).toLocaleString()}</small>
                </div>
            </div>
        </div>
        
        <div className="post-content">
            <p>{post.content}</p>
        </div>
        
        {post.image && (
            <div className="post-image">
                <img 
                    src={`http://localhost:5001${post.image}`} 
                    alt="Post attachment"
                    onClick={() => window.open(`http://localhost:5001${post.image}`, '_blank')}
                />
            </div>
        )}
        
        <div className="post-actions">
            <button 
                className={`action-btn like-btn ${post.likes?.includes(user.id) ? 'liked' : ''}`}
                onClick={() => handleLikePost(post._id)}
            >
                ❤️ Like ({post.likes?.length || 0})
            </button>
            <button onClick={() => toggleComments(post._id)}>
                💬 Comment ({post.comments?.length || 0})
            </button>
        </div>
    </div>
))}
```

## 3. ❤️ Like & Comment System Flow

### Like Post Flow
```
User clicks Like → handleLikePost() → API call → postController.js likePost (dòng 108-130)
    ↓
Check if already liked → Toggle like status → Create notification (if not self-like)
    ↓
Save to MongoDB → Return updated likes → Update Frontend state → Re-render UI
```

**Frontend:** `HomePage.js` (dòng 484-502)
```javascript
const handleLikePost = async (postId) => {
    try {
        console.log('❤️ Liking post:', postId);
        
        const response = await postsAPI.likePost(postId);
        
        if (response.data.success) {
            // Update posts state để UI thay đổi ngay lập tức (dòng 490-500)
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post._id === postId 
                        ? { 
                            ...post, 
                            likes: response.data.likes, 
                            likesCount: response.data.likesCount 
                          }
                        : post
                )
            );
            console.log('✅ Post liked/unliked successfully');
        }
    } catch (error) {
        console.error('❌ Error liking post:', error);
    }
};
```

**Backend:** `postController.js` (dòng 108-130)
```javascript
export const likePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;
        
        console.log(`❤️ Like post: ${postId} by user: ${userId}`);
        
        // Find post (dòng 115-118)
        const post = await BlogPost.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        
        // Toggle like status (dòng 120-135)
        if (post.likes.includes(userId)) {
            // Unlike: remove user từ likes array
            post.likes = post.likes.filter(id => id.toString() !== userId);
            console.log('👎 Post unliked');
        } else {
            // Like: add user to likes array
            post.likes.push(userId);
            console.log('👍 Post liked');
            
            // Create notification for post author (nếu không phải self-like)
            if (post.author.toString() !== userId) {
                await createNotification({
                    recipient: post.author,
                    sender: userId,
                    type: 'like',
                    postId: postId
                });
                console.log('🔔 Like notification created');
            }
        }
        
        await post.save();
        
        res.json({
            success: true,
            likes: post.likes,
            likesCount: post.likes.length
        });
    } catch (error) {
        console.error('❌ Like post error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
```

### Comment System Flow
```
User types comment → handleAddComment() → API call → postController.js addComment (dòng 198-250)
    ↓
Create comment object → Add to post.comments → Create notification
    ↓
Populate author info → Save → Return comments → Update Frontend → Re-render
```

**Backend:** `postController.js` (dòng 198-250)
```javascript
export const addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;
        const { content } = req.body;
        
        console.log(`💬 Adding comment to post: ${postId}`);
        
        // Find post (dòng 208-212)
        const post = await BlogPost.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        
        // Create comment object (dòng 215-222)
        const comment = {
            author: userId,
            content: content,
            createdAt: new Date(),
            likes: [],
            replies: []
        };
        
        // Add comment to post (dòng 225-230)
        post.comments.push(comment);
        await post.save();
        
        // Populate author information (dòng 232-235)
        await post.populate('comments.author', 'username firstName lastName avatar');
        
        // Create notification for post author (dòng 240-248)
        if (post.author.toString() !== userId) {
            await createNotification({
                recipient: post.author,
                sender: userId,
                type: 'comment',
                postId: postId,
                message: 'đã bình luận về bài viết của bạn'
            });
            console.log('🔔 Comment notification created');
        }
        
        res.json({
            success: true,
            comments: post.comments
        });
    } catch (error) {
        console.error('❌ Add comment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
```

## 4. 👥 Friend System Flow

### Add Friend Flow
```
User clicks Add Friend → handleAddFriend() → API call → friendController.js addFriend (dòng 8-50)
    ↓
Check existing friendship → Create 2-way relationship → Create notification
    ↓
Save to MongoDB → Return success → Update Frontend state → Update UI
```

**Frontend:** `HomePage.js` (dòng 395-430)
```javascript
const handleAddFriend = async (friendId) => {
    try {
        console.log('👥 Adding friend:', friendId);
        
        const response = await friendsAPI.addFriend(friendId);
        
        if (response.data.success) {
            // Update friends state (dòng 405-415)
            setFriends(prev => [...prev, friendId]);
            
            // Update users list để hiển thị button "Remove Friend"
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u._id === friendId 
                        ? { ...u, isFriend: true }
                        : u
                )
            );
            
            // Refresh friends list
            fetchFriends();
            console.log('✅ Friend added successfully');
        }
    } catch (error) {
        console.error('❌ Error adding friend:', error);
    }
};
```

**Backend:** `friendController.js` (dòng 8-50)
```javascript
export const addFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.id;
        
        console.log(`👥 Adding friend: ${userId} → ${friendId}`);
        
        // Validate friendId (dòng 15-18)
        if (userId === friendId) {
            return res.status(400).json({ success: false, message: 'Cannot add yourself as friend' });
        }
        
        // Check if friendship already exists (dòng 20-26)
        const existingFriendship = await Friend.findOne({
            user: userId,
            friend: friendId
        });
        
        if (existingFriendship) {
            return res.status(400).json({ success: false, message: 'Already friends' });
        }
        
        // Create 2-way friendship (dòng 30-40)
        const friendship1 = new Friend({ user: userId, friend: friendId });
        const friendship2 = new Friend({ user: friendId, friend: userId });
        
        await Promise.all([friendship1.save(), friendship2.save()]);
        console.log('💾 Friendship saved to database');
        
        // Create notification (dòng 42-48)
        await createNotification({
            recipient: friendId,
            sender: userId,
            type: 'friend_request'
        });
        console.log('🔔 Friend request notification created');
        
        res.json({ success: true, message: 'Friend added successfully' });
    } catch (error) {
        console.error('❌ Add friend error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
```

### Get Friends List với Caching
**Frontend:** `UserProfileCard.js` (dòng 14-50)
```javascript
useEffect(() => {
    const fetchFriendsCount = async () => {
        const cacheKey = 'current_user_friends';
        const cachedData = friendsCache.get(cacheKey);
        
        // Check cache validity (5 phút) (dòng 20-25)
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
            setFriendsCount(cachedData.count);
            console.log('📦 Using cached friends count:', cachedData.count);
            return;
        }

        try {
            setLoading(true);
            console.log('🔍 Fetching friends count from API...');
            
            // API call (dòng 32-40)
            const response = await friendsAPI.getFriends();
            if (response.data.success) {
                const count = response.data.friends.length;
                
                // Cache the result (dòng 35-40)
                friendsCache.set(cacheKey, {
                    count,
                    timestamp: Date.now()
                });
                
                setFriendsCount(count);
                console.log('✅ Friends count loaded:', count);
            }
        } catch (error) {
            console.error('❌ Error fetching friends:', error);
            // Fallback to cached data if available (dòng 45-50)
            if (cachedData) {
                setFriendsCount(cachedData.count);
                console.log('📦 Using expired cache as fallback');
            } else {
                setFriendsCount(0);
            }
        } finally {
            setLoading(false);
        }
    };

    fetchFriendsCount();
}, []);
```

## 5. 💬 Real-time Chat System Flow

### WebSocket Connection Flow
```
User loads page → ChatList.js useEffect → Socket.IO connection → Join personal room
    ↓
Listen for 'receive_message' events → Update messages state → Re-render UI
```

### Send Message Flow
```
User types message → sendMessage() → Emit 'private_message' → WebSocket server
    ↓
Save to MongoDB → Emit to receiver room → Update sender UI immediately
```

**WebSocket Server:** `websocketServer.js` (toàn bộ file)
```javascript
import { Server } from 'socket.io';
import ChatMessage from '../models/ChatMessage.js';

const initializeWebSocket = (server) => {
    const io = new Server(server, {
        cors: { origin: "http://localhost:3000", credentials: true }
    });
    
    console.log('🔌 WebSocket server initialized');
    
    // Connection handler (dòng 10-15)
    io.on('connection', (socket) => {
        console.log('👤 User connected:', socket.id);
        
        // Join user to personal room (dòng 18-22)
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`🏠 User ${userId} joined room`);
        });
        
        // Handle private messages (dòng 25-55)
        socket.on('private_message', async (data) => {
            try {
                console.log('📨 Receiving private message:', data);
                
                // Save message to database (dòng 30-37)
                const newMessage = new ChatMessage({
                    sender: data.senderId,
                    receiver: data.receiverId,
                    content: data.content,
                    createdAt: new Date()
                });
                
                await newMessage.save();
                console.log('💾 Message saved to database');
                
                // Populate sender info (dòng 40-42)
                await newMessage.populate('sender', 'firstName lastName avatar');
                
                // Emit to receiver's room (dòng 45-50)
                io.to(data.receiverId).emit('receive_message', newMessage);
                socket.emit('message_sent', newMessage);
                
                console.log(`📤 Message sent from ${data.senderId} to ${data.receiverId}`);
                
            } catch (error) {
                console.error('❌ Error handling private message:', error);
            }
        });
        
        // Handle disconnect (dòng 58-62)
        socket.on('disconnect', () => {
            console.log('👋 User disconnected:', socket.id);
        });
    });
    
    return io;
};

export default initializeWebSocket;
```

**Frontend Chat:** `ChatList.js` (dòng 20-150)
```javascript
// Socket connection setup (dòng 20-50)
useEffect(() => {
    console.log('🔌 Initializing socket connection...');
    
    // Create socket connection (dòng 25-30)
    socket = io('http://localhost:5001');
    socket.emit('join', user.id);
    console.log('🏠 Joined personal room:', user.id);
    
    // Listen for incoming messages (dòng 32-42)
    socket.on('receive_message', (message) => {
        console.log('📨 Received message:', message);
        setMessages(prev => [...prev, message]);
        setUnreadCount(prev => prev + 1);
        
        // Update chat list với latest message
        updateChatList(message);
    });
    
    // Cleanup on unmount (dòng 45-50)
    return () => {
        console.log('🔌 Disconnecting socket...');
        socket.disconnect();
    };
}, [user.id]);

// Send message function (dòng 80-120)
const sendMessage = async () => {
    if (!messageText.trim() || !selectedFriend) return;
    
    console.log('📤 Sending message to:', selectedFriend.firstName);
    
    // Emit message via socket (dòng 88-95)
    socket.emit('private_message', {
        senderId: user.id,
        receiverId: selectedFriend.id,
        content: messageText
    });
    
    // Update local UI immediately (dòng 98-110)
    const newMessage = {
        sender: user,
        receiver: selectedFriend,
        content: messageText,
        createdAt: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
    
    console.log('✅ Message sent and UI updated');
};
```

## 6. 🔔 Notification System Flow

### Create Notification Flow
```
User action (like/comment/friend) → Controller function → createNotification()
    ↓
Generate message based on type → Save to MongoDB → Return notification
```

### Display Notifications Flow
```
NotificationDropdown loads → API call → getNotifications() → Populate sender info
    ↓
Return paginated notifications → Update Frontend state → Render list → Auto-refresh
```

**Notification Controller:** `notificationController.js` (dòng 8-50)
```javascript
export const createNotification = async (notificationData) => {
    try {
        console.log('🔔 Creating notification:', notificationData.type);
        
        // Generate message based on type (dòng 12-28)
        let message = '';
        
        switch (notificationData.type) {
            case 'like':
                message = 'đã thích bài viết của bạn';
                break;
            case 'comment':
                message = 'đã bình luận về bài viết của bạn';
                break;
            case 'reply':
                message = 'đã trả lời bình luận của bạn';
                break;
            case 'friend_request':
                message = 'đã gửi lời mời kết bạn';
                break;
            case 'friend_accept':
                message = 'đã chấp nhận lời mời kết bạn';
                break;
            default:
                message = 'có hoạt động mới';
        }
        
        // Create and save notification (dòng 32-40)
        const notification = new Notification({
            ...notificationData,
            message
        });
        
        await notification.save();
        console.log('💾 Notification saved:', notification._id);
        
        return notification;
        
    } catch (error) {
        console.error('❌ Error creating notification:', error);
    }
};

// Get notifications với pagination (dòng 55-85)
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        console.log(`🔔 Getting notifications for user: ${userId}, page: ${page}`);
        
        // Query với pagination và populate (dòng 65-75)
        const notifications = await Notification.find({ recipient: userId })
            .populate('sender', 'firstName lastName avatar')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
        
        console.log(`📋 Found ${notifications.length} notifications`);
        
        res.json({
            success: true,
            notifications,
            currentPage: page,
            hasMore: notifications.length === limit
        });
    } catch (error) {
        console.error('❌ Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
```

**Frontend Notification:** `NotificationDropdown.js` (dòng 20-150)
```javascript
// Fetch notifications với auto-refresh (dòng 20-60)
useEffect(() => {
    const fetchNotifications = async () => {
        try {
            console.log('🔔 Fetching notifications...');
            
            // Fetch notifications list (dòng 28-32)
            const response = await notificationAPI.getNotifications();
            setNotifications(response.data.notifications);
            
            // Fetch unread count (dòng 34-38)
            const unreadResponse = await notificationAPI.getUnreadCount();
            setUnreadCount(unreadResponse.data.count);
            
            console.log('✅ Notifications loaded:', response.data.notifications.length);
            
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
        }
    };
    
    fetchNotifications();
    
    // Auto-refresh every 30 seconds (dòng 45-50)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
}, []);

// Mark as read function (dòng 70-85)
const markAsRead = async (notificationId) => {
    try {
        await notificationAPI.markAsRead(notificationId);
        
        // Update local state (dòng 75-82)
        setNotifications(prev => 
            prev.map(notif => 
                notif._id === notificationId 
                    ? { ...notif, isRead: true }
                    : notif
            )
        );
        
        setUnreadCount(prev => Math.max(0, prev - 1));
        
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
    }
};

// Render notifications (dòng 100-150)
{notifications.map(notification => (
    <div 
        key={notification._id} 
        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
        onClick={() => markAsRead(notification._id)}
    >
        <div className="notification-avatar">
            <img 
                src={notification.sender.avatar || "/api/placeholder/32/32"} 
                alt={notification.sender.firstName}
            />
        </div>
        
        <div className="notification-content">
            <span className="sender-name">
                {notification.sender.firstName} {notification.sender.lastName}
            </span>
            <span className="notification-message">
                {notification.message}
            </span>
            <small className="notification-time">
                {timeAgo(notification.createdAt)}
            </small>
        </div>
        
        {!notification.isRead && (
            <div className="unread-indicator"></div>
        )}
    </div>
))}
```

## 7. 👤 User Profile System Flow

### Profile Page Flow
```
User clicks profile → UserProfile.js loads → Fetch user data + posts in parallel
    ↓
Display user info + posts list → Like/comment functionality → Comments display
```

**User Profile:** `UserProfile.js` (dòng 50-120)
```javascript
// Fetch user data và posts (dòng 50-80)
useEffect(() => {
    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError('');
            
            console.log('🔍 Fetching user data for userId:', userId);
            
            // Parallel fetch user info và posts (dòng 60-70)
            const [userResponse, postsResponse] = await Promise.all([
                authAPI.getUserById(userId),
                postsAPI.getUserPosts(userId)
            ]);
            
            // Set user info (dòng 72-76)
            console.log('👤 User response:', userResponse.data);
            if (userResponse.data && userResponse.data.success) {
                setUserInfo(userResponse.data.user);
            }
            
            // Set user posts (dòng 78-85)
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

// Like post handler (dòng 90-110)
const handleLikePost = async (postId) => {
    try {
        const response = await postsAPI.likePost(postId);
        if (response.data.success) {
            // Update posts state immediately (dòng 95-105)
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
```

## 📊 Database Schema với Relationships

### User Collection
```javascript
{
  _id: ObjectId,           // Primary key
  username: String,        // Unique identifier
  firstName: String,       // User's first name
  lastName: String,        // User's last name
  email: String,           // Unique email
  password: String,        // Bcrypt hashed password
  avatar: String,          // Avatar image path
  location: String,        // User location
  occupation: String,      // User occupation
  createdAt: Date          // Account creation date
}
```

### BlogPost Collection với embedded comments
```javascript
{
  _id: ObjectId,                    // Primary key
  content: String,                  // Post text content
  author: ObjectId,                 // Reference to User._id
  image: String,                    // Image file path (/uploads/filename)
  likes: [ObjectId],               // Array of User._id who liked
  comments: [{                     // Embedded comments array
    _id: ObjectId,                 // Comment ID
    author: ObjectId,              // Reference to User._id
    content: String,               // Comment text
    likes: [ObjectId],            // Users who liked comment
    replies: [{                    // Nested replies array
      _id: ObjectId,               // Reply ID
      author: ObjectId,            // Reference to User._id
      text: String,               // Reply text
      createdAt: Date             // Reply timestamp
    }],
    createdAt: Date               // Comment timestamp
  }],
  createdAt: Date                  // Post creation date
}
```

### Friend Collection (2-way relationship)
```javascript
{
  _id: ObjectId,          // Primary key
  user: ObjectId,         // Reference to User._id
  friend: ObjectId,       // Reference to User._id
  createdAt: Date         // Friendship creation date
}

// Example friendship between User A and User B:
// Document 1: { user: A_id, friend: B_id }
// Document 2: { user: B_id, friend: A_id }
```

### ChatMessage Collection
```javascript
{
  _id: ObjectId,          // Primary key
  sender: ObjectId,       // Reference to User._id (sender)
  receiver: ObjectId,     // Reference to User._id (receiver)
  content: String,        // Message content
  createdAt: Date,        // Message timestamp
  seen: Boolean           // Read status (default: false)
}
```

### Notification Collection
```javascript
{
  _id: ObjectId,                          // Primary key
  recipient: ObjectId,                    // Reference to User._id (receiver)
  sender: ObjectId,                       // Reference to User._id (sender)
  type: String,                          // Enum: ['like', 'comment', 'reply', 'friend_request', 'friend_accept']
  message: String,                       // Auto-generated message text
  postId: ObjectId,                      // Reference to BlogPost._id (optional)
  commentId: String,                     // Comment ID string (optional)
  isRead: Boolean,                       // Read status (default: false)
  createdAt: Date                        // Notification timestamp
}
```

## 🔧 Complete API Reference

### Authentication APIs
```bash
POST /api/auth/register
Body: { username, firstName, lastName, email, password, location?, occupation?, avatar? }
Response: { success, token, user }

POST /api/auth/login  
Body: { email, password }
Response: { success, token, user }

GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { success, user }

GET /api/auth/user/:userId
Headers: { Authorization: "Bearer <token>" }
Response: { success, user }

GET /api/auth/users
Headers: { Authorization: "Bearer <token>" }
Response: { success, users }
```

### Posts APIs
```bash
GET /api/posts
Headers: { Authorization: "Bearer <token>" }
Response: { success, posts }

GET /api/posts/user/:userId
Headers: { Authorization: "Bearer <token>" }
Response: { success, posts }

POST /api/posts
Headers: { Authorization: "Bearer <token>", Content-Type: "multipart/form-data" }
Body: FormData { content, image? }
Response: { success, post }

POST /api/posts/:postId/like
Headers: { Authorization: "Bearer <token>" }
Response: { success, likes, likesCount }

POST /api/posts/:postId/comment
Headers: { Authorization: "Bearer <token>" }
Body: { content }
Response: { success, comments }

POST /api/posts/:postId/comment/:commentId/reply
Headers: { Authorization: "Bearer <token>" }
Body: { content }
Response: { success, comment }

POST /api/posts/:postId/comment/:commentId/like
Headers: { Authorization: "Bearer <token>" }
Response: { success, likes }
```

### Friends APIs
```bash
GET /api/friends
Headers: { Authorization: "Bearer <token>" }
Response: { success, friends }

POST /api/friends/add
Headers: { Authorization: "Bearer <token>" }
Body: { friendId }
Response: { success, message }

DELETE /api/friends/:friendId
Headers: { Authorization: "Bearer <token>" }
Response: { success, message }

GET /api/friends/check/:friendId
Headers: { Authorization: "Bearer <token>" }
Response: { success, isFriend }
```

### Chat APIs
```bash
GET /api/chat/messages/:userId
Headers: { Authorization: "Bearer <token>" }
Response: { success, messages }

POST /api/chat/send
Headers: { Authorization: "Bearer <token>" }
Body: { receiverId, content }
Response: { success, message }

GET /api/chat/list
Headers: { Authorization: "Bearer <token>" }
Response: { success, conversations }

PUT /api/chat/read/:senderId
Headers: { Authorization: "Bearer <token>" }
Response: { success }

GET /api/chat/unread-count
Headers: { Authorization: "Bearer <token>" }
Response: { success, count }
```

### Notifications APIs
```bash
GET /api/notifications?page=1&limit=10
Headers: { Authorization: "Bearer <token>" }
Response: { success, notifications, currentPage, hasMore }

PUT /api/notifications/:notificationId/read
Headers: { Authorization: "Bearer <token>" }
Response: { success }

GET /api/notifications/unread-count
Headers: { Authorization: "Bearer <token>" }
Response: { success, count }
```

## 🔒 Security & Performance

### Security Features
1. **JWT Authentication**: 7-day expiry tokens, middleware protection
2. **Password Security**: Bcrypt hashing (salt rounds = 10)
3. **Input Validation**: Joi schemas for all inputs
4. **CORS Protection**: Restricted to frontend domain
5. **File Upload Security**: Type và size restrictions

### Performance Optimizations
1. **Caching**: Friends count cache (5 min), session storage
2. **Database**: Lean queries, selective population, proper indexing
3. **Frontend**: Component memoization, debounced inputs
4. **Real-time**: Socket.IO rooms, efficient event handling

### Monitoring
- Request timing logs trong controllers
- Error tracking với detailed messages
- Performance metrics cho critical operations

---

**Tài liệu này cung cấp complete data flow và implementation details cho toàn bộ Social Media Platform với code examples và line numbers cụ thể.**
