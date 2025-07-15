## AE backend dùng expressjs module es6 để code nhá dùng chung nodemon để chạy server 


---

## 📊 Bảng ERD chi tiết (có kiểu dữ liệu)

| Collection       | Field         | Type                      | Reference                  | Description                          |
|-------------------|---------------|---------------------------|----------------------------|--------------------------------------|
| **User**         | _id           | ObjectId (auto)           |                            | ID người dùng                        |
|                   | username      | String (unique, required)|                            | Tên người dùng                       |
|                   | email         | String (unique, required)|                            | Email người dùng                     |
|                   | password      | String (required)        |                            | Mật khẩu đã hash                     |
|                   | avatar        | String (optional)        |                            | URL avatar                           |
|                   | createdAt     | Date (default: now)      |                            | Ngày tạo                             |
| **BlogPost**     | _id           | ObjectId (auto)           |                            | ID bài viết                          |
|                   | author        | ObjectId (required)      | ➔ User                     | Người đăng bài                       |
|                   | content       | String (required)        |                            | Nội dung bài viết                    |
|                   | image         | String (optional)        |                            | URL hình ảnh đính kèm                |
|                   | likes         | Array<ObjectId>          | ➔ User[]                   | Danh sách user đã like               |
|                   | shares        | Array<ObjectId>          | ➔ User[]                   | Danh sách user đã share              |
|                   | createdAt     | Date (default: now)      |                            | Ngày đăng bài                        |
| **Comment**      | _id           | ObjectId (auto)           |                            | ID bình luận                         |
|                   | post          | ObjectId (required)      | ➔ BlogPost                 | Bài viết được comment                |
|                   | author        | ObjectId (required)      | ➔ User                     | Người comment                        |
|                   | content       | String (required)        |                            | Nội dung bình luận                   |
|                   | createdAt     | Date (default: now)      |                            | Ngày comment                         |
| **ChatMessage**  | _id           | ObjectId (auto)           |                            | ID tin nhắn                          |
|                   | sender        | ObjectId (required)      | ➔ User                     | Người gửi                            |
|                   | receiver      | ObjectId (required)      | ➔ User                     | Người nhận                           |
|                   | content       | String (required)        |                            | Nội dung tin nhắn                    |
|                   | createdAt     | Date (default: now)      |                            | Ngày gửi tin nhắn                    |
|                   | seen          | Boolean (default: false) |                            | Trạng thái đã đọc hay chưa           |

---

## 📈 Quan hệ giữa các collection

- **User**
  - Một `User` có thể đăng nhiều `BlogPost`.
  - Một `User` có thể viết nhiều `Comment`.
  - Một `User` có thể gửi hoặc nhận nhiều `ChatMessage`.
  - Một `User` có thể like/share nhiều `BlogPost`.
- **BlogPost**
  - Thuộc về một `User` (author).
  - Có thể có nhiều `Comment`.
  - Lưu danh sách `likes`, `shares` (User ID).
- **Comment**
  - Thuộc về một `User` (author).
  - Thuộc về một `BlogPost`.
- **ChatMessage**
  - Thuộc về một `User` (sender).
  - Thuộc về một `User` (receiver).

---
