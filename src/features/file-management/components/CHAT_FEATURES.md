# File Management Chat - Tính năng hỗ trợ

## Tổng quan

Chat AI hỗ trợ người dùng (cả Leader và Member) quản lý file thông qua ngôn ngữ tự nhiên.

## Các tính năng File Management hiện có

### 1. **Upload & Download**

- Upload files/folders
- Download files/folders
- Import từ Google Drive link
- Progress tracking với ETA
- Cancel upload/download

### 2. **Folder Operations**

- Tạo folder mới
- Xóa folder (soft delete)
- Di chuyển folder
- Đổi tên folder
- Browse folders (phân cấp)

### 3. **File Operations**

- Xóa file (soft delete)
- Di chuyển file
- Đổi tên file
- Preview file
- Download file

### 4. **Search & Filter**

- Tìm kiếm theo tên
- Lọc theo loại file (image, video, document, etc.)
- Lọc theo người tạo (chỉ Leader)
- Sắp xếp (tên, kích thước, ngày)
- Hiển thị favorites

### 5. **Share & Permissions** (chủ yếu Leader)

- Share file/folder
- Cấp quyền cho member
- Thu hồi quyền
- Public/Private sharing

### 6. **Favorites**

- Thêm vào favorites
- Xóa khỏi favorites
- Hiển thị danh sách favorites

### 7. **Trash Management**

- Xem items đã xóa
- Khôi phục items
- Xóa vĩnh viễn

## Chat có thể hỗ trợ

### ✅ **Tìm kiếm File (Natural Language Search)**

- "Tìm file PDF tôi đã upload tuần trước"
- "File nào có tên chứa 'report'?"
- "Hiển thị tất cả video trong thư mục 'Projects'"
- "File nào của [tên member]?" (Leader only)

### ✅ **Tóm tắt & Giải thích**

- "Tóm tắt file [tên file]"
- "File này nói về gì?"
- "Giải thích nội dung file PDF này"

### ✅ **Thao tác File/Folder**

- "Tạo thư mục tên 'Documents'"
- "Di chuyển file 'report.pdf' vào thư mục 'Archive'"
- "Đổi tên folder 'Old' thành 'New'"
- "Xóa file 'temp.txt'"

### ✅ **Gợi ý & Tối ưu hóa**

- "File nào đang chiếm nhiều dung lượng nhất?"
- "Gợi ý file nào nên xóa?"
- "File nào tôi chưa mở lâu rồi?"
- "Có file trùng lặp không?"

### ✅ **Cảnh báo & Nhắc nhở**

- "File nào đang được share public?"
- "File nào có thể chứa thông tin nhạy cảm?"
- "Cảnh báo về file lớn"

### ✅ **Hỗ trợ Context-Aware**

- Chat biết đang ở folder nào (`currentFolderId`)
- Có thể navigate đến file/folder từ chat
- Hiển thị danh sách folders/files hiện tại

## Backend APIs có sẵn

### File Operations

- `POST /api/upload` - Upload file
- `GET /api/upload` - List files/folders
- `POST /api/upload/folder` - Create folder
- `DELETE /api/upload` - Delete items
- `POST /api/upload/move` - Move items
- `PATCH /api/upload/rename` - Rename item
- `GET /api/download` - Download file
- `GET /api/files/browse` - Browse folders (for chat)

### Share & Permissions

- `POST /api/share` - Share file/folder
- `GET /api/folders/permissions` - Get accessible folders
- `POST /api/folders/permissions` - Grant permission
- `DELETE /api/folders/permissions` - Revoke permission

### Favorites

- `GET /api/favorites` - Get favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites` - Remove favorite

### Search

- `GET /api/upload/search` - Search files/folders

## Frontend Components

### Leader

- `FileManagemant.jsx` - Main component
- `useFileManagementPage.js` - Hook với đầy đủ tính năng
- Đã có chat: ✅

### Member

- `MemberFileManager.jsx` - Main component
- `useManagement.js` - Hook với tính năng giới hạn
- Đã có chat: ✅ (vừa thêm)

### Chat Component

- `FileManagerChat.jsx` - Component chung cho cả Leader và Member
- Location: `FE/src/features/file-management/components/FileManagerChat.jsx`
- Props:
  - `isOpen` - Trạng thái mở/đóng
  - `onClose` - Callback đóng chat
  - `currentFolderId` - ID folder hiện tại
  - `folders` - Danh sách folders
  - `files` - Danh sách files
  - `onNavigateToFile` - Callback khi click file
  - `onNavigateToFolder` - Callback khi click folder

## Next Steps (Backend)

### Cần tạo API cho Chat AI:

1. **Chat Endpoint**: `POST /api/chat/file-management`

   - Input: `{ message: string, currentFolderId?: string, context?: {...} }`
   - Output: `{ response: string, actions?: [...], files?: [...] }`

2. **File Search API**: Có thể mở rộng `/api/upload/search` để hỗ trợ natural language

3. **File Content Analysis**:

   - PDF text extraction
   - Image OCR
   - Video transcript

4. **Smart Suggestions**:
   - Duplicate detection
   - Large file detection
   - Old file detection

## Notes

- Chat hiện tại chỉ có UI, chưa có backend integration
- Cần tích hợp với AI service (OpenAI, Claude, etc.)
- Cần xử lý context (current folder, selected files) để chat hiểu rõ hơn
