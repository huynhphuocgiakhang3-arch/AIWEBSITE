# Deployment

Chưa được triển khai thật hay test trên bất kỳ nền tảng nào trong quá
trình tạo source này (không có network trong sandbox phát triển). Nội
dung dưới đây là hướng dẫn dựa trên hiểu biết về Next.js 14 App Router,
CHƯA được xác nhận bằng một lần deploy thật cho riêng project này.

## Vercel

```bash
vercel --prod
```

⚠️ **Lưu ý quan trọng về `HPGK_DATA_DIR`:** Vercel serverless functions
có filesystem ephemeral — file JSON ghi trong `data/` sẽ **KHÔNG persist**
giữa các lần invoke khác nhau. Với kiến trúc JSON-file v1 hiện tại,
**KHÔNG deploy lên Vercel serverless nếu cần dữ liệu persistent** (mọi
conversation/project sẽ biến mất). Hai lựa chọn:

1. Deploy lên nền tảng có persistent filesystem (Render, VPS, Railway
   với volume) thay vì Vercel serverless.
2. Nâng cấp `lib/db.ts` lên Prisma + PostgreSQL (Vercel Postgres hoặc
   Neon) trước khi deploy lên Vercel — xem đường nâng cấp mô tả trong
   `docs/architecture.md`.

## Render (phù hợp hơn cho v1 hiện tại)

Theo đúng pattern [[khanghuynh-shop]] đang dùng:

1. Tạo Web Service, connect repo
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Thêm Persistent Disk, mount vào đường dẫn khớp với `HPGK_DATA_DIR` và
   `HPGK_WORKSPACE_DIR` trong biến môi trường — bắt buộc để dữ liệu JSON
   và file project không mất khi service restart.
5. Set `ANTHROPIC_API_KEY` trong Environment Variables.

## Trước khi deploy bất kỳ đâu — checklist

- [ ] `npm run verify` pass hoàn toàn ở máy có mạng (chưa được xác nhận
      bởi tôi — xem `docs/verification-status.md`)
- [ ] `ANTHROPIC_API_KEY` được set qua biến môi trường của platform,
      KHÔNG commit vào `.env` trong git (đã có `.gitignore` chặn `.env`)
- [ ] Volume/disk persistent được mount đúng cho `HPGK_DATA_DIR` nếu
      không dùng Vercel serverless với Postgres
- [ ] Thêm rate limiting (xem knowledge entry `be-rate-limiting`) trước
      khi expose API công khai — hiện tại CHƯA có rate limiting nào
- [ ] Xem xét thêm authentication nếu nhiều người dùng chung một instance
      — hiện tại là hệ thống single-user không có auth
