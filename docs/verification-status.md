# Verification Status — báo cáo trung thực

Tài liệu này tồn tại vì yêu cầu gốc (mục 21): "Không báo build thành công
nếu chưa thực sự kiểm tra." Đây KHÔNG phải README marketing — đây là ghi
chép chính xác những gì đã chạy thật và những gì chưa.

## Môi trường tạo ra source này

Source code này được viết trong một sandbox **không có network access**
(đã kiểm chứng: request tới `registry.npmjs.org` trả về `403
host_not_allowed` từ egress proxy). Điều này có nghĩa:

- ❌ `npm install` **không chạy được** trong môi trường đó
- ❌ `next build`, `next dev` **chưa từng được chạy**
- ❌ ESLint **chưa từng được chạy**
- ❌ Toàn bộ UI React/Next.js (app/, components/) **chưa được render thử,
  chưa xác nhận compile được**

Node.js v22.22.2 sẵn có trong sandbox, hỗ trợ chạy TypeScript trực tiếp
qua `--experimental-strip-types` **mà không cần npm install** — đây là
cách phần lõi (core/) và lib/db.ts được kiểm chứng thật ngay trong quá
trình phát triển.

## Những gì ĐÃ được chạy thật và PASS

Chạy bằng `node --experimental-strip-types --test <file>` — kết quả TAP
đầy đủ đã được xem trực tiếp, không phải suy đoán.

| Module | Số test | Kết quả |
|---|---|---|
| `core/knowledge/retrieval.ts` | 11 | ✅ 11/11 pass |
| `core/knowledge/index.ts` (nạp knowledge JSON thật) | 5 | ✅ 5/5 pass |
| `core/security/zip-guard.ts` | 13 | ✅ 13/13 pass (1 lỗi phát hiện và sửa trong lúc phát triển) |
| `core/diagnostics/rules.ts` | 10 | ✅ 10/10 pass |
| `core/diagnostics/stack-detection.ts` | 7 | ✅ 7/7 pass |
| `core/memory/store.ts` | 9 | ✅ 9/9 pass |
| `core/agent/pipeline.ts` (guard chống vòng lặp vô hạn) | 7 | ✅ 7/7 pass |
| `core/agent/tools/file-tools.ts` (đọc/ghi file + path traversal thật trên đĩa) | 5 | ✅ 5/5 pass |
| `lib/db.ts` (JSON persistence thật trên đĩa) | 7 | ✅ 7/7 pass |
| **Tổng** | **74** | **✅ 74/74 pass** |

Chạy lại để tự xác nhận:

```bash
node --experimental-strip-types --test $(find core lib -name "*.test.ts")
```

Cũng đã smoke-test thủ công: `core/providers/not-configured-provider.ts`
và `core/providers/anthropic-provider.ts` import và chạy được, trả về
đúng cấu trúc lỗi "not_configured" khi chưa có API key (không có
exception, không có fake response).

## Những gì CHƯA được chạy — cần bạn xác nhận ở máy có mạng

- ❌ `npm install` — chưa từng chạy. Có thể có lỗi version conflict giữa
  các dependency trong package.json chưa được phát hiện.
- ❌ `npm run build` (Next.js production build) — **chưa xác nhận project
  compile được**. Đây là rủi ro lớn nhất: các file `.tsx` trong `app/` và
  `components/` được viết theo đúng API Next.js 14 App Router mà tôi biết,
  nhưng chưa được trình biên dịch TypeScript/Next.js thực sự kiểm tra.
- ❌ `npm run lint` — chưa chạy ESLint.
- ❌ `npm run typecheck` — chưa chạy `tsc --noEmit` trên toàn bộ project
  (chỉ các file core/lib được chạy trực tiếp qua Node, không phải qua
  trình kiểm tra kiểu đầy đủ của tsc).
- ❌ `lib/zip.ts` — phụ thuộc `adm-zip`, chưa cài được nên chưa test được
  luồng giải nén thật. Logic gọi đúng API `AdmZip` theo tài liệu chính
  thức, nhưng **chưa có bằng chứng thực thi**.
- ❌ Toàn bộ API routes trong `app/api/` — chưa gọi thử qua HTTP thật (cần
  Next.js server chạy được trước).
- ❌ Toàn bộ trang UI (`app/page.tsx`, `app/projects/`, `app/knowledge/`,
  `app/files/`, `app/settings/`) — chưa render thử trong trình duyệt.
- ❌ Không có bằng chứng về hiệu năng, khả năng chịu tải, hay hành vi khi
  deploy thật lên Vercel/Render.

## Việc bạn cần làm để tự xác nhận

```bash
npm install
npm run typecheck   # xem có lỗi type nào ở lớp Next.js/React không
npm run lint
npm test            # sẽ chạy lại đúng 74 test đã pass ở trên
npm run build       # xác nhận Next.js build thành công thật
```

Nếu bất kỳ bước nào ở trên thất bại, đó là lỗi thật cần sửa — không phải
điều tôi có thể "báo trước là sẽ pass" một cách trung thực.

## Về các con số trong Knowledge Core

15 knowledge entries thật (5 domain: frontend, backend, database,
security, ai-engineering), mỗi entry đầy đủ theo schema yêu cầu (why/how/
best_practices/common_mistakes/tradeoffs...), biên soạn thủ công — KHÔNG
phải "1.2M+ concepts" như trong ảnh concept UI (đó là số liệu demo cho
mục đích minh hoạ thiết kế, không phải số liệu thật của hệ thống này).

## Về phạm vi so với spec gốc 47 mục

Spec gốc yêu cầu một hệ điều hành AI đầy đủ (multi-language i18n runtime,
WCAG audit toàn diện, test coverage cho toàn bộ UI, CI/CD, virtualized
history, semantic/embedding retrieval...). Bản v1 này tập trung vào:

- ✅ Kiến trúc modular đúng như spec (core/ tách biệt UI, provider tách
  biệt knowledge)
- ✅ Toàn bộ logic an toàn/nghiệp vụ cốt lõi có test thật
- ✅ Không có fake AI, không có fake statistics ở bất kỳ đâu trong code
- ⚠️ UI đầy đủ nhưng chưa polish toàn bộ theo đúng thẩm mỹ "cinematic" của
  ảnh concept — phần đó nằm trong prototype HTML trước đó, chưa port hết
  animation/particle vào layer React
- ⚠️ Không có accessibility audit toàn diện, không có i18n runtime thật
  (chỉ có tiếng Việt hardcode trong UI), không có CI pipeline
- ❌ Không có semantic/embedding retrieval (chỉ có keyword retrieval —
  đúng yêu cầu "offline-first" nhưng không phải "state of the art")
