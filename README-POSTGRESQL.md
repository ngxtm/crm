# 🐘 Hướng dẫn chuyển đổi sang PostgreSQL/Supabase

## Tổng quan

Dự án đã được chuyển đổi từ Firebase Realtime Database sang PostgreSQL (Supabase). Hệ thống hiện sử dụng:
- **Frontend**: React app (port 3000)
- **Backend API**: Express server (port 3001)
- **Database**: PostgreSQL trên Supabase

## Cấu trúc

```
quanlyxuongin-main/
├── server/              # Backend API server
│   ├── index.ts         # Express server với PostgreSQL
│   ├── package.json     # Dependencies cho server
│   └── tsconfig.json    # TypeScript config cho server
├── services/
│   └── postgresService.ts  # Service gọi API backend
├── hooks/
│   └── useFirebaseData.ts  # Hooks sử dụng PostgreSQL (đã cập nhật)
└── database.config.ts   # Cấu hình database connection
```

## Bước 1: Cài đặt Dependencies

### Frontend (đã có sẵn)
```bash
npm install
```

### Backend Server
```bash
cd server
npm install
```

## Bước 2: Cấu hình Database

1. Tạo file `.env` trong thư mục `server/`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.cbelilmfjitkadtffhto.supabase.co:5432/postgres
PORT=3001
```

**Lưu ý**: Thay `[YOUR-PASSWORD]` bằng mật khẩu thực tế của bạn.

2. Tạo file `.env` trong thư mục gốc (cho frontend):

```env
VITE_API_URL=http://localhost:3001/api
```

## Bước 3: Tạo Database Schema

Chạy file SQL để tạo các bảng:

```bash
# Kết nối vào Supabase PostgreSQL và chạy:
psql -h db.cbelilmfjitkadtffhto.supabase.co -U postgres -d postgres -f database.sql
```

Hoặc copy nội dung file `database.sql` và chạy trong Supabase SQL Editor.

## Bước 4: Chạy Backend Server

```bash
cd server
npm run dev
```

Server sẽ chạy tại: `http://localhost:3001`

## Bước 5: Chạy Frontend

Trong terminal khác:

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000` (hoặc port khác nếu 3000 đã được sử dụng)

## Kiểm tra kết nối

1. Kiểm tra backend: Mở `http://localhost:3001/api/health`
2. Kiểm tra frontend: Mở `http://localhost:3000`

## API Endpoints

Backend cung cấp các endpoints sau:

- `GET /api/health` - Health check
- `GET /api/leads` - Lấy danh sách leads
- `POST /api/leads` - Tạo lead mới
- `PUT /api/leads/:id` - Cập nhật lead
- `DELETE /api/leads/:id` - Xóa lead
- `GET /api/orders` - Lấy danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `PUT /api/orders/:id` - Cập nhật đơn hàng
- `DELETE /api/orders/:id` - Xóa đơn hàng
- `GET /api/employees` - Lấy danh sách nhân viên
- `POST /api/employees` - Tạo nhân viên mới
- `PUT /api/employees/:id` - Cập nhật nhân viên
- `DELETE /api/employees/:id` - Xóa nhân viên
- `GET /api/design-orders` - Lấy danh sách đơn thiết kế
- `POST /api/design-orders` - Tạo đơn thiết kế mới
- `PUT /api/design-orders/:id` - Cập nhật đơn thiết kế
- `DELETE /api/design-orders/:id` - Xóa đơn thiết kế
- `GET /api/design-items` - Lấy danh sách mẫu thiết kế
- `POST /api/design-items` - Tạo mẫu thiết kế mới
- `PUT /api/design-items/:id` - Cập nhật mẫu thiết kế
- `DELETE /api/design-items/:id` - Xóa mẫu thiết kế
- `GET /api/sale-allocations` - Lấy danh sách phân bổ bán hàng
- `GET /api/customer-groups` - Lấy danh sách nhóm khách hàng
- `GET /api/lead-sources` - Lấy danh sách nguồn khách hàng
- `GET /api/sale-agents` - Lấy danh sách nhân viên bán hàng

## Troubleshooting

### Lỗi kết nối database
- Kiểm tra `DATABASE_URL` trong file `.env` của server
- Đảm bảo mật khẩu đúng và không có ký tự đặc biệt cần encode
- Kiểm tra firewall của Supabase có cho phép kết nối từ IP của bạn

### Lỗi CORS
- Backend đã cấu hình CORS để cho phép frontend
- Nếu vẫn lỗi, kiểm tra `VITE_API_URL` trong frontend `.env`

### Lỗi "Cannot find module"
- Chạy `npm install` trong cả frontend và backend
- Đảm bảo đã cài đặt tất cả dependencies

## Production Deployment

Khi deploy lên production:

1. **Backend**: 
   - Set `DATABASE_URL` trong environment variables
   - Set `PORT` (hoặc để mặc định 3001)
   - Deploy lên Vercel, Railway, hoặc Heroku

2. **Frontend**:
   - Set `VITE_API_URL` trỏ đến backend production URL
   - Build: `npm run build`
   - Deploy lên Vercel, Netlify, hoặc hosting khác

## Chuyển đổi từ Mock Data

Để chuyển từ mock data sang PostgreSQL, đảm bảo:
- `USE_MOCK_DATA = false` trong `hooks/useFirebaseData.ts`
- Backend server đang chạy
- Database đã có schema và dữ liệu
