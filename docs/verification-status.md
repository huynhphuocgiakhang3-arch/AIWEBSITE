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

## Bug thật đã phát hiện SAU khi giao lần 2 (qua build thật trên Vercel)

- **`Module not found: Can't resolve './tokens.css'`** trong
  `app/globals.css`. Lỗi path đơn giản: `tokens.css` nằm ở `styles/`,
  không cùng thư mục với `app/globals.css`. **Đã sửa:** đổi thành
  `@import '../styles/tokens.css';`.

- **Rủi ro type-check chưa từng được kiểm tra:** `node
  --experimental-strip-types` (cách tôi chạy 74 test) chỉ STRIP cú pháp
  TypeScript, KHÔNG type-check gì cả — nên nó không thể bắt được lỗi
  kiểu mà `tsc`/`next build` sẽ bắt. Khi rà lại thủ công (vì build sắp
  chạy full type-check thật), phát hiện 3 lớp vấn đề kiểu thật, đều liên
  quan tới `"noUncheckedIndexedAccess": true` trong tsconfig (khiến
  `arr[i]` có kiểu `T | undefined` thay vì `T`):

  1. `core/agent/pipeline.ts` — `steps[steps.length - 1]` dùng để lấy lại
     step vừa push, trong khi biến `step` đó đã có sẵn trong scope. **Sửa:**
     dùng thẳng `step` thay vì index lại — loại bỏ hoàn toàn việc index,
     không phải vá lỗi kiểu.
  2. `core/security/zip-guard.ts` — hai chỗ dùng `entries[0]` làm "entry
     đại diện" cho lỗi ở MỨC ARCHIVE (quá nhiều entry / vượt tổng dung
     lượng). **Sửa tận gốc:** tách hẳn một field mới
     `archiveLevelRejection` trong `ZipArchiveValidationResult` cho đúng
     bản chất (đây là lỗi của archive, không phải của một entry cụ thể),
     bỏ hẳn việc cần một "entry giả" — cấu trúc dữ liệu đúng hơn, không
     chỉ là né lỗi kiểu. Đã cập nhật 2 test tương ứng và `lib/zip.ts`.
  3. `core/memory/store.ts` (`findDuplicates`) — `records[i]`/`records[j]`
     trong vòng lặp lồng nhau. **Sửa:** thêm `if (!a) continue` /
     `if (!b) continue` ngay sau khi lấy phần tử — thu hẹp kiểu trung
     thực bằng guard thật, KHÔNG dùng non-null assertion (`!`), đúng yêu
     cầu "không non-null assertion" đã nêu.

  Đã quét lại toàn bộ `core/`, `lib/`, `app/`, `components/` cho các
  pattern index nguy hiểm tương tự (`[0]`, `[i]`, `[j]`, `length - 1]`,
  `.find(...)` không guard) — không còn trường hợp nào chưa được guard
  đúng. Cũng xác nhận **zero non-null assertion (`!`)** trong toàn bộ
  source thật (đã grep kiểm tra).

  74/74 test vẫn PASS sau các sửa đổi này (chạy lại xác nhận).

- **Vẫn CHƯA có bằng chứng `next build` thật sự pass.** Những sửa đổi
  trên dựa trên đọc kỹ lại code với hiểu biết về ngữ nghĩa
  `noUncheckedIndexedAccess`, KHÔNG phải vì đã chạy `tsc`/`next build`
  và thấy xanh — sandbox vẫn không có network. Rất có thể còn lỗi type
  khác chưa lộ ra cho tới khi bạn chạy `next build` thật.

## Bug thật đã phát hiện SAU khi giao lần 1 (qua lần deploy thật của bạn trên Vercel)

- **`npm install` thất bại: ERESOLVE conflict.** `eslint@^9.0.0` không
  tương thích với `eslint-config-next@14.2.x` (yêu cầu peer `eslint ^7
  || ^8`). Đây đúng là loại lỗi tôi đã cảnh báo trước trong mục "Những
  gì CHƯA được chạy" — vì sandbox phát triển không có network nên không
  thể tự phát hiện lỗi này trước khi giao.
  **Đã sửa:** hạ `eslint` xuống `^8.57.0`. Cũng hạ `@types/node` từ
  `^22.0.0` xuống `^20.14.0` để khớp với `engines.node` (>=20) và giảm
  rủi ro type surface không khớp runtime thật trên Vercel.
- **Thiếu file cấu hình ESLint.** `package.json` có script
  `"lint": "eslint ."` nhưng repo chưa từng có `.eslintrc.json` — nếu
  không phát hiện lỗi ERESOLVE trước, bước lint tiếp theo chắc chắn sẽ
  fail vì thiếu config. **Đã thêm** `.eslintrc.json` (extends
  `next/core-web-vitals`).
- Hai lỗi trên **CHƯA được xác nhận đã hết** bằng một lần `npm install`
  thành công thật — tôi chỉ sửa dựa trên phân tích version compatibility
  đã biết (eslint-config-next 14.2.x + eslint 8.x là cặp version chính
  thức Next.js 14 khuyến nghị), KHÔNG phải vì đã chạy lại và thấy pass.
  Bạn cần chạy lại `npm install` để xác nhận.

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
