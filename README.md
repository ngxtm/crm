# CRM Printing - Hệ thống quản lý khách hàng ngành in ấn

Hệ thống CRM chuyên biệt cho ngành in ấn bao bì (hộp giấy, túi giấy), tích hợp AI thiết kế và công cụ tính giá.

## Tính năng chính

- **Quản lý Lead**: Thu thập, phân bổ tự động, theo dõi lịch sử tương tác
- **Quản lý Khách hàng**: Chuyển đổi từ lead, quản lý công nợ, lịch sử đơn hàng
- **Yêu cầu thiết kế**: Upload file, theo dõi tiến độ, quản lý đơn thiết kế
- **Tính giá hộp/túi**: Công cụ tính toán chi phí sản xuất, bình file tự động
- **AI Thiết kế**: Tạo mẫu túi giấy với AI (Gemini, DALL-E)
- **Export Excel**: Xuất dữ liệu leads, khách hàng, báo giá

## Yêu cầu hệ thống

- Node.js >= 18.x
- pnpm >= 8.x
- PostgreSQL (Supabase)

## Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/your-username/crm.git
cd crm
```

### 2. Cài đặt dependencies

```bash
# Cài pnpm nếu chưa có
npm install -g pnpm

# Cài đặt tất cả dependencies
pnpm install
```

### 3. Cấu hình môi trường

#### Backend (apps/api/.env)

```env
# Database - Lấy từ Supabase Dashboard > Settings > Database
DATABASE_URL="postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase - Lấy từ Supabase Dashboard > Settings > API
SUPABASE_URL="https://[project-id].supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Service Role Key (secret)

# Server
PORT=3001
NODE_ENV=development

# AI APIs (optional)
GOOGLE_AI_STUDIO_KEY="your-google-ai-key"
```

#### Frontend (apps/web/.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### 4. Thiết lập Database

```bash
cd apps/api

# Pull schema từ Supabase (nếu đã có database)
pnpm exec prisma db pull

# Hoặc push schema lên Supabase (nếu database trống)
pnpm exec prisma db push

# Generate Prisma Client
pnpm exec prisma generate
```

### 5. Thiết lập Supabase Storage (cho upload file)

1. Vào **Supabase Dashboard** > **Storage**
2. Tạo bucket mới: `design-files`
3. Tick chọn **Public bucket**
4. Click **Create bucket**

### 6. Chạy ứng dụng

```bash
# Từ thư mục gốc
pnpm dev
```

Ứng dụng sẽ chạy tại:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Cấu trúc thư mục

```
crm/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/        # Business modules
│   │   │   │   ├── leads/
│   │   │   │   ├── customers/
│   │   │   │   ├── design-orders/
│   │   │   │   ├── sales-employees/
│   │   │   │   └── ...
│   │   │   ├── common/         # Shared services
│   │   │   └── prisma/         # Database service
│   │   └── prisma/
│   │       └── schema.prisma   # Database schema
│   │
│   └── web/                    # Next.js Frontend
│       ├── app/                # App router pages
│       │   └── (dashboard)/    # Dashboard pages
│       ├── components/         # React components
│       │   ├── features/       # Feature components
│       │   └── ui/             # Shared UI components
│       ├── lib/                # Utilities
│       │   ├── excel-utils.ts  # Excel export/import
│       │   └── types.ts        # TypeScript types
│       └── types/              # Additional types
│
├── packages/                   # Shared packages
├── docs/                       # Documentation
└── package.json
```

## Scripts

```bash
# Development
pnpm dev              # Chạy cả frontend và backend
pnpm dev:web          # Chỉ chạy frontend
pnpm dev:api          # Chỉ chạy backend

# Build
pnpm build            # Build tất cả
pnpm build:web        # Build frontend
pnpm build:api        # Build backend

# Database
cd apps/api
pnpm exec prisma studio     # Mở Prisma Studio
pnpm exec prisma db push    # Push schema changes
pnpm exec prisma generate   # Regenerate client

# Lint & Format
pnpm lint
pnpm format
```

## API Endpoints

### Leads
- `GET /api/leads` - Danh sách leads
- `POST /api/leads` - Tạo lead mới
- `PATCH /api/leads/:id` - Cập nhật lead
- `DELETE /api/leads/:id` - Xóa lead

### Design Orders
- `GET /api/design-orders` - Danh sách yêu cầu thiết kế
- `POST /api/design-orders` - Tạo yêu cầu mới
- `POST /api/design-orders/:id/upload` - Upload file thiết kế
- `DELETE /api/design-orders/:id/files/:fileName` - Xóa file

### Customers
- `GET /api/customers` - Danh sách khách hàng
- `POST /api/customers` - Tạo khách hàng
- `PATCH /api/customers/:id` - Cập nhật thông tin

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, Lucide Icons
- **Backend**: NestJS, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Monorepo**: Turborepo, pnpm

## Troubleshooting

### Lỗi "pnpm not found"
```bash
npm install -g pnpm
```

### Lỗi Prisma generate EPERM
Tắt API server đang chạy, sau đó chạy lại:
```bash
pnpm exec prisma generate
```

### Lỗi upload file "Bucket not found"
Tạo bucket `design-files` trong Supabase Dashboard > Storage

### Lỗi "row-level security policy"
Đang dùng anon key thay vì service role key. Cập nhật `SUPABASE_SERVICE_KEY` trong `.env`.

### Port đã được sử dụng
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

## License

MIT
