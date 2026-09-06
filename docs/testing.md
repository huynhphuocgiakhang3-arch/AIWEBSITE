# Testing

## Chạy test thật

```bash
npm test
# tương đương:
node --experimental-strip-types --test $(find core lib -name "*.test.ts")
```

Không cần `npm install` trước để chạy test của `core/` và `lib/db.ts` —
các module này KHÔNG import package ngoài nào, chỉ dùng Node.js built-in
(`node:fs`, `node:path`, `node:test`, `node:assert`). Đây là lựa chọn
thiết kế có chủ đích để lõi hệ thống luôn kiểm chứng được ngay cả trong
môi trường không có network.

## Tình trạng test hiện tại (xem `docs/verification-status.md` để biết chi tiết đầy đủ)

74/74 test PASS, chia theo module — bảng đầy đủ nằm trong
`verification-status.md`, không lặp lại ở đây để tránh hai nguồn sự thật
lệch nhau theo thời gian.

## Nguyên tắc viết test trong repo này

1. **Test hành vi thật, không test giả định.** Ví dụ `zip-guard.test.ts`
   dùng đúng payload tấn công thật (`../../etc/passwd`), không chỉ test
   "hàm trả về đúng kiểu dữ liệu".
2. **Test cả đường thất bại, không chỉ đường thành công.** Mỗi module có
   ít nhất một test xác nhận hành vi khi input xấu/thiếu/độc hại.
3. **Không mock những gì có thể chạy thật.** `lib/db.test.ts` và
   `file-tools.test.ts` thao tác trên filesystem THẬT (qua
   `fs.mkdtemp`), không mock `fs` — bug thật trong logic path sẽ lộ ra
   ngay, không bị che giấu bởi mock sai.
4. **Dependency injection cho phần cần AI/thời gian thật.**
   `pipeline.test.ts` inject `planner`, `verifier`, và `clock` giả lập —
   cho phép test timeout mà không cần chờ 60 giây thật, và test logic
   vòng lặp mà không tốn API cost gọi AI thật.

## Chưa có (thành thật)

- Không có test cho `lib/zip.ts` (phụ thuộc `adm-zip`, chưa cài được).
  **Việc đầu tiên bạn nên làm sau `npm install`** là viết
  `lib/zip.test.ts` tạo một file ZIP thật (dùng chính `adm-zip` để tạo)
  chứa cả entry hợp lệ và entry tấn công, gọi `analyzeAndExtractZip()`,
  xác nhận entry tấn công bị chặn và entry hợp lệ được giải nén đúng.
- Không có test cho API routes (`app/api/**/route.ts`) — cần
  `next/jest` hoặc gọi trực tiếp handler function với `NextRequest` giả
  lập sau khi `npm install` xong.
- Không có test UI/component (React Testing Library chưa được thêm vào
  `devDependencies`).
- Không có E2E test (Playwright/Cypress).
- Không có test hiệu năng/tải (load testing).
