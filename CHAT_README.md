# Hướng dẫn sử dụng chức năng Chat

## Tổng quan
Chức năng chat được tích hợp vào ứng dụng social media với các tính năng:
- Chat real-time sử dụng WebSocket
- Gửi và nhận tin nhắn tức thì
- Hiển thị trạng thái "đang nhập"
- Đánh dấu tin nhắn đã đọc
- Hiển thị số tin nhắn chưa đọc
- Giao diện responsive

## Cài đặt và chạy

### Backend
1. Cài đặt dependencies:
```bash
cd Social-media/backend
npm install
```

2. Tạo file `.env` với nội dung:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/social_media
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

3. Chạy server:
```bash
npm start
```

### Frontend
1. Cài đặt dependencies:
```bash
cd Social-media/frontend
npm install
```

2. Chạy ứng dụng:
```bash
npm start
```

## Cấu trúc code

### Backend
- `models/ChatMessage.js`: Schema cho tin nhắn chat
- `controllers/chatController.js`: Logic xử lý chat
- `routes/chatRoutes.js`: API routes cho chat
- `websocket/websocketServer.js`: WebSocket server cho real-time chat
- `server.js`: Tích hợp WebSocket với Express server

### Frontend
- `components/Chat.js`: Component chính cho chat
- `components/ChatList.js`: Danh sách các cuộc trò chuyện
- `components/ChatWindow.js`: Cửa sổ chat với tin nhắn
- `App.js`: Tích hợp chat vào ứng dụng

## API Endpoints

### Chat Routes
- `POST /api/chat/send` - Gửi tin nhắn
- `GET /api/chat/messages/:userId` - Lấy tin nhắn với user
- `GET /api/chat/list` - Lấy danh sách chat
- `PUT /api/chat/read/:senderId` - Đánh dấu đã đọc

### WebSocket Events
- `send_message` - Gửi tin nhắn
- `receive_message` - Nhận tin nhắn
- `typing` - Trạng thái đang nhập
- `user_typing` - Người dùng đang nhập
- `mark_as_read` - Đánh dấu đã đọc
- `messages_read` - Tin nhắn đã được đọc

## Cách sử dụng

1. **Đăng nhập**: Đăng nhập vào ứng dụng
2. **Truy cập chat**: Click vào nút chat (icon tin nhắn) trên thanh header
3. **Chọn cuộc trò chuyện**: Click vào một user trong danh sách chat
4. **Gửi tin nhắn**: Nhập tin nhắn và nhấn Enter hoặc click "Gửi"
5. **Xem tin nhắn**: Tin nhắn sẽ hiển thị real-time

## Tính năng

### Real-time Chat
- Tin nhắn được gửi và nhận ngay lập tức
- Không cần refresh trang

### Typing Indicator
- Hiển thị khi người dùng đang nhập tin nhắn
- Tự động ẩn sau 1 giây ngừng nhập

### Read Status
- Đánh dấu tin nhắn đã đọc tự động
- Hiển thị số tin nhắn chưa đọc

### Responsive Design
- Giao diện tối ưu cho mobile và desktop
- Layout thích ứng với kích thước màn hình

## Troubleshooting

### Lỗi kết nối WebSocket
- Kiểm tra server backend có đang chạy không
- Kiểm tra port 5000 có bị block không
- Kiểm tra JWT token có hợp lệ không

### Tin nhắn không gửi được
- Kiểm tra kết nối internet
- Kiểm tra user receiver có tồn tại không
- Kiểm tra console để xem lỗi

### Không nhận được tin nhắn real-time
- Kiểm tra WebSocket connection
- Refresh trang và thử lại
- Kiểm tra authentication token

## Mở rộng tính năng

Có thể thêm các tính năng sau:
- Gửi file/hình ảnh
- Emoji picker
- Voice messages
- Group chat
- Message reactions
- Message search
- Message deletion
- Online/offline status 