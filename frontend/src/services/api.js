import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Tạo axios instance với cấu hình mặc định
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor để thêm token vào header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor để xử lý response
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', {
            message: error.message,
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method
        });
        
        if (error.response?.status === 401) {
            // Token hết hạn, logout user
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Test connection
export const testConnection = () => api.get('/health');

// Auth API
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getAllUsers: () => api.get('/auth/users'),
    getCurrentUser: () => api.get('/auth/me'),
    getUserById: (userId) => api.get(`/auth/user/${userId}`),
};

// Chat API
export const chatAPI = {
    sendMessage: (messageData) => api.post('/chat/send', messageData),
    getMessages: (userId) => api.get(`/chat/messages/${userId}`),
    getChatList: () => api.get('/chat/list'),
    markAsRead: (senderId) => api.put(`/chat/read/${senderId}`),
    getUnreadCount: () => api.get('/chat/unread-count'),
    markAllAsRead: () => api.put('/chat/mark-all-read'),
};

// Friends API
export const friendsAPI = {
    getFriends: () => api.get('/friends'),
    addFriend: (friendId) => api.post('/friends/add', { friendId }),
    removeFriend: (friendId) => api.delete(`/friends/${friendId}`),
    checkFriendship: (friendId) => api.get(`/friends/check/${friendId}`),
};

// Posts API (nếu cần)
export const postsAPI = {
    getPosts: () => api.get('/posts'),
    getUserPosts: (userId) => api.get(`/posts/user/${userId}`),
    createPost: (postData) => {
        console.log('🔗 API createPost called with:', postData);
        console.log('🔑 Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
        
        if (postData.image) {
            const formData = new FormData();
            formData.append('content', postData.content);
            formData.append('image', postData.image);
            console.log('📎 Sending with FormData (image included)');
            return api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            console.log('📄 Sending with JSON (text only)');
            return api.post('/posts', { content: postData.content });
        }
    },
    updatePost: (postId, postData) => api.put(`/posts/${postId}`, postData),
    deletePost: (postId) => api.delete(`/posts/${postId}`),
    likePost: (postId) => api.post(`/posts/${postId}/like`),
    unlikePost: (postId) => api.delete(`/posts/${postId}/like`),
    addComment: (postId, commentData) => api.post(`/posts/${postId}/comments`, commentData),
    updateComment: (postId, commentId, commentData) => api.put(`/posts/${postId}/comments/${commentId}`, commentData),
    deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`),
    likeComment: (postId, commentId) => api.post(`/posts/${postId}/comments/${commentId}/like`),
    unlikeComment: (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}/like`),
    replyToComment: (postId, commentId, replyData) => api.post(`/posts/${postId}/comments/${commentId}/reply`, replyData),
    updateReply: (postId, commentId, replyId, replyData) => api.put(`/posts/${postId}/comments/${commentId}/reply/${replyId}`, replyData),
    deleteReply: (postId, commentId, replyId) => api.delete(`/posts/${postId}/comments/${commentId}/reply/${replyId}`),
};

// Notification API
export const notificationAPI = {
    getNotifications: (page = 1, limit = 20) => api.get(`/notifications?page=${page}&limit=${limit}`),
    markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
    markAllAsRead: () => api.put('/notifications/mark-all-read'),
    deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
    getUnreadCount: () => api.get('/notifications/unread-count'),
};

export default api; 