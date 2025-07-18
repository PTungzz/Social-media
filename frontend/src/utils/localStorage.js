// Local Storage utility functions for Sociopedia

// Keys for local storage
const STORAGE_KEYS = {
  USER: 'sociopedia_user',
  POSTS: 'sociopedia_posts',
  FRIENDS: 'sociopedia_friends',
  USERS: 'sociopedia_users' // Store all registered users
};

// User management
export const saveUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
};

export const getUser = () => {
  try {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const logout = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
};

// All users management (for login validation)
export const saveUserToRegistry = async (user) => {
  try {
    const users = getAllUsers();
    
    // Convert picture to base64 if it exists
    let profilePicture = null;
    
    if (user.picture && user.picture instanceof File) {
      profilePicture = await convertFileToBase64(user.picture);
    }
    
    const userWithId = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      profilePicture: profilePicture
    };
    
    users.push(userWithId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return userWithId;
  } catch (error) {
    console.error('Error saving user to registry:', error);
    return null;
  }
};

// Helper function to convert file to base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

export const getAllUsers = () => {
  try {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

export const findUserByEmail = (email) => {
  try {
    const users = getAllUsers();
    return users.find(user => user.email === email);
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
};

// Posts management
export const savePosts = (posts) => {
  try {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return true;
  } catch (error) {
    console.error('Error saving posts:', error);
    return false;
  }
};

export const getPosts = () => {
  try {
    const posts = localStorage.getItem(STORAGE_KEYS.POSTS);
    return posts ? JSON.parse(posts) : [];
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
};

export const addPost = (post) => {
  try {
    const posts = getPosts();
    const newPost = {
      ...post,
      id: Date.now().toString(),
      likes: 0,
      comments: [],
      likedBy: [],
      timestamp: new Date().toISOString()
    };
    
    posts.unshift(newPost); // Add to beginning
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return newPost;
  } catch (error) {
    console.error('Error adding post:', error);
    return null;
  }
};

export const updatePost = (postId, updates) => {
  try {
    const posts = getPosts();
    const postIndex = posts.findIndex(post => post.id === postId);
    
    if (postIndex !== -1) {
      posts[postIndex] = { ...posts[postIndex], ...updates };
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      return posts[postIndex];
    }
    return null;
  } catch (error) {
    console.error('Error updating post:', error);
    return null;
  }
};

export const deletePost = (postId) => {
  try {
    const posts = getPosts();
    const filteredPosts = posts.filter(post => post.id !== postId);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(filteredPosts));
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
};

// Friends management
export const getFriends = (userId) => {
  try {
    const friends = localStorage.getItem(STORAGE_KEYS.FRIENDS);
    const allFriends = friends ? JSON.parse(friends) : {};
    return allFriends[userId] || [];
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
};

export const addFriend = (userId, friendId) => {
  try {
    const friends = localStorage.getItem(STORAGE_KEYS.FRIENDS);
    const allFriends = friends ? JSON.parse(friends) : {};
    
    if (!allFriends[userId]) {
      allFriends[userId] = [];
    }
    
    if (!allFriends[userId].includes(friendId)) {
      allFriends[userId].push(friendId);
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(allFriends));
    }
    
    return true;
  } catch (error) {
    console.error('Error adding friend:', error);
    return false;
  }
};

export const removeFriend = (userId, friendId) => {
  try {
    const friends = localStorage.getItem(STORAGE_KEYS.FRIENDS);
    const allFriends = friends ? JSON.parse(friends) : {};
    
    if (allFriends[userId]) {
      allFriends[userId] = allFriends[userId].filter(id => id !== friendId);
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(allFriends));
    }
    
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
};

export const isFriend = (userId, friendId) => {
  try {
    const userFriends = getFriends(userId);
    return userFriends.includes(friendId);
  } catch (error) {
    console.error('Error checking friendship:', error);
    return false;
  }
};

// Initialize with sample data (chỉ chạy lần đầu)
export const initializeSampleData = () => {
  try {
    const existingUsers = getAllUsers();
    if (existingUsers.length === 0) {
      const sampleUsers = [
        {
          id: '1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@sociopedia.com',
          password: 'admin123',
          location: 'Hà Nội',
          occupation: 'Developer',
          profilePicture: null,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@sociopedia.com',
          password: 'test123',
          location: 'Hồ Chí Minh',
          occupation: 'Designer',
          profilePicture: null,
          createdAt: new Date().toISOString()
        }
      ];
      
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(sampleUsers));
      
      // Sample posts
      const samplePosts = [
        {
          id: '1',
          content: 'Chào mừng đến với Sociopedia! 🎉',
          author: sampleUsers[0],
          timestamp: new Date().toISOString(),
          likes: 5,
          comments: [],
          likedBy: [],
          attachments: []
        },
        {
          id: '2',
          content: 'Hôm nay thật đẹp trời! ☀️',
          author: sampleUsers[1],
          timestamp: new Date().toISOString(),
          likes: 3,
          comments: [],
          likedBy: [],
          attachments: []
        }
      ];
      
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(samplePosts));
      
      // Sample friendships
      const sampleFriends = {
        '1': ['2'],
        '2': ['1']
      };
      
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(sampleFriends));
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};
