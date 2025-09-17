# Migration từ Prisma sang MySQL2

## Tổng quan
Dự án đã được chuyển đổi từ Prisma ORM sang MySQL2 driver để giải quyết vấn đề memory trên server có ít RAM.

## Thay đổi chính

### 1. Dependencies
- ❌ Gỡ bỏ: `@prisma/client`, `prisma`
- ✅ Thêm: `mysql2`

### 2. Database Connection
- **Trước**: Prisma Client với connection pooling tự động
- **Sau**: MySQL2 connection pool với cấu hình tùy chỉnh

### 3. Models
- **Trước**: Prisma models với type safety
- **Sau**: Custom models với MySQL2 queries

### 4. Queries
- **Trước**: Prisma query builder
- **Sau**: Raw SQL queries với prepared statements

## Cách sử dụng

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy migrations
```bash
npm run db:migrate
```

### 3. Test database connection
```bash
npm run db:test
```

### 4. Seed database
```bash
npm run db:seed
```

### 5. Chạy ứng dụng
```bash
npm start
```

## Cấu trúc mới

### Database Config (`src/config/database.js`)
- MySQL2 connection pool
- Graceful shutdown handling
- Error logging

### Models (`src/models/index.js`)
- BaseModel class với CRUD operations
- User, Group, GroupMember, Task models
- Custom query methods

### Services
- **authService**: Authentication với MySQL2
- **taskService**: Task management
- **groupService**: Group management
- **evaluationService**: AI evaluation

## Lợi ích

1. **Memory Usage**: Giảm đáng kể memory usage
2. **Performance**: Raw SQL nhanh hơn ORM
3. **Control**: Kiểm soát hoàn toàn queries
4. **Compatibility**: Hoạt động trên server yếu

## Lưu ý

1. **Type Safety**: Mất type safety của Prisma
2. **Query Building**: Phải viết SQL thủ công
3. **Migrations**: Phải quản lý migrations thủ công
4. **Relations**: Phải handle relations thủ công

## Troubleshooting

### Lỗi connection
```bash
# Kiểm tra database config
npm run db:test

# Kiểm tra logs
tail -f logs/error.log
```

### Lỗi migration
```bash
# Chạy lại migration
npm run db:migrate

# Reset database
npm run db:reset
```

## Support

Nếu gặp vấn đề, kiểm tra:
1. Database connection settings
2. MySQL server status
3. Log files trong `logs/`
4. Environment variables
