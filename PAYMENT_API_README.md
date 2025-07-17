# Payment Method API Documentation

## Tổng quan

API quản lý phương thức thanh toán cho admin dashboard, hỗ trợ CRUD operations và thống kê.

## Models

### PaymentMethod Schema

```javascript
{
  name: String,           // Tên phương thức thanh toán (required)
  type: String,           // Loại: "bank", "card", "ewallet", "crypto", "other" (required)
  accountNumber: String,  // Số tài khoản (required)
  accountName: String,    // Tên tài khoản (required)
  bankName: String,       // Tên ngân hàng (optional)
  description: String,    // Mô tả (optional)
  isActive: Boolean,      // Trạng thái hoạt động (default: true)
  icon: String,           // Icon emoji (default: "💳")
  sortOrder: Number,      // Thứ tự sắp xếp (default: 0)
  createdAt: Date,        // Thời gian tạo (auto)
  updatedAt: Date         // Thời gian cập nhật (auto)
}
```

## API Endpoints

### 1. Lấy danh sách Payment Methods

```
GET /api/admin/payment-methods
```

**Query Parameters:**

- `page`: Số trang (default: 1)
- `limit`: Số lượng item mỗi trang (default: 10)
- `search`: Tìm kiếm theo tên, tên tài khoản, ngân hàng
- `type`: Lọc theo loại
- `isActive`: Lọc theo trạng thái (true/false)

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 2. Tạo Payment Method mới

```
POST /api/admin/payment-methods
```

**Body:**

```json
{
  "name": "Vietcombank",
  "type": "bank",
  "accountNumber": "1234567890",
  "accountName": "Công ty ABC",
  "bankName": "Vietcombank",
  "description": "Tài khoản chính",
  "icon": "🏦",
  "sortOrder": 1
}
```

### 3. Lấy chi tiết Payment Method

```
GET /api/admin/payment-methods/:id
```

### 4. Cập nhật Payment Method

```
PUT /api/admin/payment-methods/:id
```

### 5. Xóa Payment Method

```
DELETE /api/admin/payment-methods/:id
```

### 6. Toggle trạng thái Active/Inactive

```
PATCH /api/admin/payment-methods/:id/toggle
```

### 7. Lấy thống kê

```
GET /api/admin/payment-methods/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 25,
    "active": 20,
    "inactive": 5,
    "recent": 3,
    "typeStats": [
      {
        "type": "bank",
        "count": 15,
        "activeCount": 12,
        "inactiveCount": 3
      }
    ]
  }
}
```

## Authentication

Tất cả API endpoints yêu cầu admin token trong header:

```
Authorization: Bearer <token>
```

## Error Responses

```json
{
  "error": "Error message"
}
```

**Status Codes:**

- 200: Success
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden (not admin)
- 404: Not Found
- 500: Internal Server Error

## Service Usage

### Frontend Service

```javascript
import paymentMethodService from "@/lib/paymentMethodService";

// Lấy danh sách
const response = await paymentMethodService.getPaymentMethods({
  page: 1,
  limit: 10,
  search: "Vietcombank",
});

// Tạo mới
const newMethod = await paymentMethodService.createPaymentMethod({
  name: "Vietcombank",
  type: "bank",
  accountNumber: "1234567890",
  accountName: "Công ty ABC",
});

// Cập nhật
const updated = await paymentMethodService.updatePaymentMethod(id, data);

// Xóa
await paymentMethodService.deletePaymentMethod(id);

// Toggle status
await paymentMethodService.togglePaymentMethodStatus(id);

// Lấy thống kê
const stats = await paymentMethodService.getPaymentMethodStats();
```

## Validation Rules

### Required Fields

- `name`: Không được để trống
- `type`: Phải là một trong ["bank", "card", "ewallet", "crypto", "other"]
- `accountNumber`: Không được để trống
- `accountName`: Không được để trống

### Type Mapping

- `bank`: Ngân hàng
- `card`: Thẻ tín dụng
- `ewallet`: Ví điện tử
- `crypto`: Tiền điện tử
- `other`: Khác

## Database Indexes

- `name`: Unique index
- `type`: Index
- `isActive`: Index
- `createdAt`: Index (descending)
