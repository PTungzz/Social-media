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
};

// Chat API
export const chatAPI = {
    sendMessage: (messageData) => api.post('/chat/send', messageData),
    getMessages: (userId) => api.get(`/chat/messages/${userId}`),
    getChatList: () => api.get('/chat/list'),
    markAsRead: (senderId) => api.put(`/chat/read/${senderId}`),
};

// Posts API (nếu cần)
export const postsAPI = {
    getPosts: () => api.get('/posts'),
    createPost: (postData) => api.post('/posts', postData),
    updatePost: (postId, postData) => api.put(`/posts/${postId}`, postData),
    deletePost: (postId) => api.delete(`/posts/${postId}`),
    likePost: (postId) => api.post(`/posts/${postId}/like`),
    unlikePost: (postId) => api.delete(`/posts/${postId}/like`),
    addComment: (postId, commentData) => api.post(`/posts/${postId}/comments`, commentData),
};

export default api; 