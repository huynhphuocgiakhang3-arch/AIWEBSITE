# Kiến trúc HPGK Agent v1.0

## Nguyên tắc nền tảng: Knowledge ≠ Model (mục 40 spec gốc)

```
┌─────────────────────────────────────────────────────────┐
│                         UI (app/)                        │
│   Next.js App Router — pages + API routes                │
└───────────────────────┬───────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌───────────────┐ ┌──────────────┐ ┌────────────────┐
│  core/agent/   │ │ core/         │ │  core/          │
│  Agent Pipeline│ │ knowledge/    │ │  providers/     │
│  (planner,     │ │ Retrieval     │ │  AI adapter     │
│  guards, tools)│ │ engine +      │ │  (Anthropic/    │
│                │ │ data (JSON)   │ │  not-configured)│
└───────┬────────┘ └──────────────┘ └─────────────────┘
        │
        ▼
┌────────────────┐  ┌─────────────────┐  ┌────────────────┐
│ core/security/  │  │ core/diagnostics/│  │ core/memory/   │
│ ZIP guard       │  │ Rules engine +   │  │ Store logic    │
│ (path traversal,│  │ stack detection  │  │ (scoring,      │
│ zip bomb...)    │  │                  │  │ decay, prune)  │
└────────────────┘  └─────────────────┘  └────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  lib/ — adapter thật cho persistence (JSON file) và ZIP  │
│  (adm-zip), nối core/ logic vào filesystem thật          │
└─────────────────────────────────────────────────────────┘
```

Điểm mấu chốt: **mọi thứ trong `core/` không phụ thuộc AI provider**.
Retrieval, diagnostics, security, memory scoring, agent loop guard — tất
cả là logic xác định (deterministic), test được bằng input/output cụ thể,
không cần gọi model nào. Model (qua `core/providers/`) chỉ được dùng ở
tầng agent để *sinh ngôn ngữ và lên kế hoạch*, không phải để *chứa tri
thức* hay *quyết định điều kiện dừng an toàn*.

## Vì sao JSON file thay vì PostgreSQL/Prisma ở v1

Môi trường tạo ra source này không có network access để `npm install`
Prisma hay kết nối một Postgres instance thật. JSON file (`lib/db.ts`)
là lựa chọn CÓ CHỦ ĐÍCH cho v1: chạy được ngay, không cần hạ tầng, đủ cho
single-instance self-host hoặc VPS đơn giản (đúng pattern deploy Render/
Vercel mà [[khanghuynh-vault]] hay dùng, nhưng ở quy mô nhỏ hơn).

### Đường nâng cấp lên Prisma + PostgreSQL

`JsonTable<T>` trong `lib/db.ts` expose interface `all/get/insert/update/
remove/replaceAll` — viết một `PrismaTable<T>` implement cùng interface
này, đổi import ở các API route, không cần sửa logic nghiệp vụ. Không làm
việc này trong v1 vì (1) không thể `npm install @prisma/client` để test
ở đây, (2) thêm một dependency hạ tầng (Postgres instance) làm tăng chi
phí vận hành không cần thiết cho một hệ thống single-user ở giai đoạn đầu.

## Vì sao keyword retrieval thay vì embedding/semantic search

Theo đúng yêu cầu "offline-first knowledge" (mục 41 spec gốc): retrieval
phải hoạt động MÀ KHÔNG CẦN gọi AI provider. `core/knowledge/retrieval.ts`
là keyword + metadata filtering thuần, không phụ thuộc gì ngoài Node.js
built-in. Đây là fallback bắt buộc phải luôn hoạt động.

Nếu muốn thêm semantic retrieval sau này: thêm một `core/knowledge/
semantic-retrieval.ts` dùng embedding model (qua provider), và ở tầng gọi
(API route `/api/knowledge/search`) thử semantic trước, catch lỗi/timeout
rồi fallback về `retrieve()` hiện có. KHÔNG thay thế keyword retrieval —
chỉ bổ sung.

## Luồng ZIP intelligence (mục 17-18 spec gốc)

```
Upload → analyzeAndExtractZip() [lib/zip.ts]
  ├─ 1. Đọc metadata TOÀN BỘ entry (không giải nén) — readZipEntryMetas()
  ├─ 2. validateZipArchive() [core/security/zip-guard.ts, ĐÃ TEST 13/13]
  │     → nếu BẤT KỲ entry nào vi phạm → từ chối TOÀN BỘ archive
  ├─ 3. Giải nén từng entry đã qua validate vào workspaceDir riêng của project
  ├─ 4. detectStack() [core/diagnostics/stack-detection.ts, ĐÃ TEST 7/7]
  └─ 5. Cập nhật ProjectRecord (detectedStack, fileCount)
```

## Luồng Agent (mục 13 spec gốc)

```
runAgent() [core/agent/pipeline.ts, ĐÃ TEST 7/7]
  loop (tối đa maxIterations, có timeout, có repeat-detection):
    1. planner(history) → quyết định hành động tiếp theo (tool call hoặc respond)
       — planner THẬT sẽ gọi AI provider; trong test dùng mock planner
    2. Thực thi hành động (tool.run() hoặc kết thúc bằng respond)
    3. verifier(history) → true/false — CHỈ khi true, succeeded = true
  Dừng vì 1 trong 4 lý do: verified_success | max_iterations_reached |
  timeout | repeated_action_detected
  → succeeded CHỈ true ở lý do đầu tiên, đúng mục 20: "không báo thành
    công nếu chưa verify"
```

## Danh sách tool đã implement cho agent

- `search_knowledge` — nối retrieval engine
- `run_diagnostics` — nối diagnostics rules engine
- `read_file` / `write_file` — thao tác trong 1 project workspace, có
  kiểm tra path traversal (đã test 5/5, bao gồm tấn công thật)

## Những gì CHƯA có trong kiến trúc này (nói rõ để không hiểu nhầm)

- Không có message queue / background job worker (ZIP lớn được xử lý
  đồng bộ trong request — chấp nhận được cho v1, cần cải thiện nếu
  file lớn gây timeout HTTP)
- Không có auth/user system — hệ thống hiện tại là single-user
- Không có rate limiting trên API routes (xem knowledge entry
  `be-rate-limiting` — nên áp dụng trước khi expose ra internet công khai)
- Không có real-time streaming response cho chat (dùng request/response
  đơn giản, chưa dùng Server-Sent Events/streaming của Anthropic API)
