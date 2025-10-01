# Sitemap & Robots.txt Configuration

## 📋 Tổng quan

Dự án đã được cấu hình để tự động tạo `sitemap.xml` và `robots.txt` sử dụng `next-sitemap`.

## 🚀 Cách sử dụng

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Tạo sitemap và robots.txt

```bash
# Cách 1: Sử dụng script tự tạo
npm run sitemap

# Cách 2: Sử dụng next-sitemap trực tiếp
npx next-sitemap

# Cách 3: Tự động sau khi build
npm run build
```

### 3. Kiểm tra kết quả

Sau khi chạy, kiểm tra các file được tạo trong `public/`:

- `public/sitemap.xml`
- `public/robots.txt`

## ⚙️ Cấu hình

### File: `next-sitemap.config.js`

#### Các trang được include (có trong sitemap):

- `/` - Trang chủ
- `/about` - Giới thiệu
- `/contact` - Liên hệ
- `/faq` - Câu hỏi thường gặp
- `/privacy_policy` - Chính sách bảo mật
- `/terms_of_use` - Điều khoản sử dụng
- `/cookie_policy` - Chính sách cookie

#### Các trang được exclude (không có trong sitemap):

- Tất cả trang admin (`/admin/*`)
- Tất cả trang member (`/member/*`)
- Tất cả trang leader (`/*/leader/*`)
- Trang đăng nhập (`/Login`, `/ForgotPassword`)
- Trang chia sẻ động (`/share/*`)

### File: `robots.txt`

#### Allow (cho phép crawl):

- Trang chủ và các trang public
- Trang giới thiệu, liên hệ, FAQ
- Trang chính sách

#### Disallow (không cho phép crawl):

- Tất cả trang private (admin, member, leader)
- Trang đăng nhập
- Trang chia sẻ

## 🔧 Tùy chỉnh

### Thay đổi URL gốc

Sửa trong `next-sitemap.config.js`:

```javascript
siteUrl: process.env.SITE_URL || 'https://d2mbox.com',
```

Hoặc tạo file `.env.local`:

```
SITE_URL=https://your-domain.com
```

### Thêm/bỏ trang khỏi sitemap

Sửa mảng `exclude` trong `next-sitemap.config.js`:

```javascript
exclude: [
  '/new-private-page/*',
  // ... other exclusions
],
```

### Thay đổi priority và changefreq

Sửa object `customPaths` trong `transform` function:

```javascript
const customPaths = {
  "/new-page": {
    priority: 0.9,
    changefreq: "daily",
  },
  // ... other pages
};
```

## 📊 Monitoring

### Kiểm tra sitemap

- Truy cập: `https://your-domain.com/sitemap.xml`
- Sử dụng Google Search Console để submit sitemap

### Kiểm tra robots.txt

- Truy cập: `https://your-domain.com/robots.txt`
- Sử dụng Google Search Console để test robots.txt

## 🐛 Troubleshooting

### Lỗi "next-sitemap not found"

```bash
npm install next-sitemap --save-dev
```

### Sitemap không được tạo

1. Kiểm tra file `next-sitemap.config.js` có đúng syntax
2. Chạy `npm run build` trước khi tạo sitemap
3. Kiểm tra quyền ghi file trong thư mục `public/`

### Robots.txt không đúng

1. Kiểm tra cấu hình `robotsTxtOptions` trong config
2. Xóa file `public/robots.txt` cũ và tạo lại
3. Kiểm tra format của `policies` array

## 📝 Notes

- Sitemap được tạo tự động sau mỗi lần `npm run build`
- Có thể chạy riêng lẻ với `npm run sitemap`
- File config hỗ trợ cả static và dynamic routes
- Tự động exclude các trang private để bảo mật
