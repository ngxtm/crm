# 🚀 CRM TurboRepo - Quick Start (1 Hour Setup)

## ⚡ Refactor Tự Động (10-15 phút)

### Bước 1: Chạy script tự động

```bash
# Chỉ cần double-click file này:
RUN-REFACTOR.bat
```

**Script sẽ tự động:**
1. ✅ Xóa Firebase files
2. ✅ Xóa documentation cũ
3. ✅ Tạo TurboRepo structure
4. ✅ Setup Next.js + NestJS
5. ✅ Setup Prisma + Supabase clients
6. ✅ Tạo Phase A/B module folders

**Thời gian:** ~10-15 phút (phụ thuộc vào tốc độ mạng)

---

## 🔑 Bước 2: Cập nhật API Keys (2 phút)

### apps/api/.env
```env
DATABASE_URL="postgresql://postgres:Tichdc1ty1234@db.cbelilmfjitkadtffhto.supabase.co:5432/postgres"
SUPABASE_URL="https://cbelilmfjitkadtffhto.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGc..."  # ← Update this from Supabase Dashboard
PORT=3001
```

### apps/web/.env.local
```env
NEXT_PUBLIC_SUPABASE_URL="https://cbelilmfjitkadtffhto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."  # ← Update this from Supabase Dashboard
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

**Lấy keys ở đâu?**
- Vào Supabase Dashboard → Project Settings → API
- Copy `anon public` và `service_role` keys

---

## 📊 Bước 3: Pull Database Schema (2 phút)

```bash
cd apps/api
pnpm exec prisma db pull
pnpm exec prisma generate
```

**Output:** File `apps/api/prisma/schema.prisma` với tất cả tables

---

## 🏃 Bước 4: Start Development (1 phút)

```bash
# Từ root folder
pnpm dev
```

**Kết quả:**
- ✅ Next.js: http://localhost:3000
- ✅ NestJS API: http://localhost:3001

---

## 👥 Phân Công Công Việc

### 🟦 Track A (Bạn) - Lead Management

**Phase A1:** Lead Sources & Campaigns Backend (2 ngày)
- File: `apps/api/src/modules/lead-sources/`
- File: `apps/api/src/modules/campaigns/`
- Docs: `d:\Area\crm\docs\phase-A1-lead-sources-backend.md`

**Phase A2:** Leads CRUD & Webhooks (3 ngày)
- File: `apps/api/src/modules/leads/`
- File: `apps/api/src/modules/webhooks/`
- Docs: `d:\Area\crm\docs\phase-A2-leads-crud-webhooks.md`

**Phase A3:** Lead Frontend (2 ngày)
- File: `apps/web/app/(dashboard)/leads/`
- File: `apps/web/app/(dashboard)/campaigns/`
- Docs: `d:\Area\crm\docs\phase-A3-lead-frontend.md`

### 🟩 Track B (Teammate) - Sales & Assignment

**Phase B1:** Sales Employees Backend (2 ngày)
- File: `apps/api/src/modules/sales-employees/`
- Docs: `d:\Area\crm\docs\phase-B1-sales-employees-backend.md`

**Phase B2:** Product Groups & Assignment (3 ngày)
- File: `apps/api/src/modules/product-groups/`
- File: `apps/api/src/modules/assignment/`
- Docs: `d:\Area\crm\docs\phase-B2-product-groups-assignment.md`

**Phase B3:** Stats Dashboard (2 ngày)
- File: `apps/web/app/(dashboard)/assignment/`
- File: `apps/web/app/(dashboard)/dashboard/`
- Docs: `d:\Area\crm\docs\phase-B3-stats-dashboard.md`

---

## 📁 New Structure

```
crm-monorepo/
├── apps/
│   ├── web/                    # Next.js (bạn làm Phase A3)
│   │   ├── app/
│   │   │   └── (dashboard)/
│   │   │       ├── leads/      # ← A3
│   │   │       ├── campaigns/  # ← A3
│   │   │       └── ...
│   │   └── components/
│   │
│   └── api/                    # NestJS (bạn làm Phase A1, A2)
│       ├── src/
│       │   └── modules/
│       │       ├── lead-sources/    # ← A1
│       │       ├── campaigns/       # ← A1
│       │       ├── leads/           # ← A2
│       │       ├── webhooks/        # ← A2
│       │       ├── sales-employees/ # ← B1 (teammate)
│       │       ├── product-groups/  # ← B2 (teammate)
│       │       └── assignment/      # ← B2 (teammate)
│       └── prisma/
│           └── schema.prisma   # Auto-generated từ Supabase
│
├── packages/
│   ├── shared-types/          # Shared TypeScript types
│   └── ui/                    # Shared UI components
│
└── temp/                      # Old code (reference only)
    ├── old-components/        # React components cũ
    └── old-server/            # Express server cũ
```

---

## 🛠️ Development Commands

```bash
# Start all apps
pnpm dev

# Start frontend only
pnpm dev --filter=web

# Start backend only
pnpm dev --filter=api

# Build everything
pnpm build

# Lint
pnpm lint

# Update Prisma schema from Supabase
cd apps/api
pnpm exec prisma db pull
pnpm exec prisma generate
```

---

## 📝 Phase A1 Quick Start (Your First Task)

### 1. Create Lead Sources Module

```bash
cd apps/api/src/modules/lead-sources
```

**Files to create:**
- `lead-sources.module.ts`
- `lead-sources.controller.ts`
- `lead-sources.service.ts`
- `dto/create-lead-source.dto.ts`
- `dto/update-lead-source.dto.ts`

### 2. Follow Phase A1 Doc

Open: `d:\Area\crm\docs\phase-A1-lead-sources-backend.md`

Copy code từ doc → Paste vào files → Done!

### 3. Test Endpoint

```bash
# Start API
pnpm dev --filter=api

# Test với curl hoặc Postman
curl http://localhost:3001/api/lead-sources
```

---

## ⏰ Timeline (1 Tuần)

**Ngày 1-2:** Phase A1 (Lead Sources + Campaigns backend)
**Ngày 3-5:** Phase A2 (Leads CRUD + Webhooks)
**Ngày 6-7:** Phase A3 (Lead Frontend UI)

**Parallel:** Teammate làm Phase B1-B3

---

## 🆘 Troubleshooting

### pnpm not found
```bash
npm install -g pnpm
```

### Prisma pull fails
- Kiểm tra DATABASE_URL trong `apps/api/.env`
- Kiểm tra internet connection
- Kiểm tra Supabase project còn active

### Next.js port 3000 already in use
```bash
# Kill process
npx kill-port 3000
# hoặc
lsof -ti:3000 | xargs kill
```

---

## ✅ Success Checklist

Sau khi refactor xong, kiểm tra:

- [ ] `pnpm dev` chạy được (cả web và api)
- [ ] `apps/api/prisma/schema.prisma` có data
- [ ] http://localhost:3000 mở được
- [ ] http://localhost:3001 mở được
- [ ] Folder structure đúng
- [ ] API keys đã update

---

## 🎯 Next Step After Refactor

1. ✅ Refactor xong (1 giờ)
2. → Start Phase A1 implementation (follow docs)
3. → Daily sync với teammate
4. → Code review
5. → Merge

**Good luck! 🚀**
