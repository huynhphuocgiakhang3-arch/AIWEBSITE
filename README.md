# HPGK Agent v1.0

> Intelligence that builds with you.

AI Workspace + Knowledge Engine + Code Agent — xây từ số 0, kiến trúc
modular, không fake AI, không fake số liệu.

## ⚠️ Đọc trước khi dùng: docs/verification-status.md

Source này được viết trong môi trường **không có network access**. Phần
lõi (74 test) đã được chạy thật và PASS. Phần Next.js/React (toàn bộ
`app/`, `components/`, và `lib/zip.ts`) **chưa được `npm install`, chưa
build, chưa chạy thử** — xem chi tiết đầy đủ, trung thực trong
[`docs/verification-status.md`](docs/verification-status.md) trước khi
tin tưởng đưa vào production.

## Bắt đầu

```bash
cp .env.example .env.local
# Điền ANTHROPIC_API_KEY vào .env.local nếu muốn chat hoạt động thật
# (nếu để trống, HPGK sẽ báo "AI provider not configured" — không fake response)

npm install
npm run verify   # chạy typecheck + lint + test + build, dừng ở lỗi đầu tiên
npm run dev
```

## Đã implement — kiểm chứng thật (74/74 test PASS)

| Hệ thống | File | Test |
|---|---|---|
| Knowledge Core (15 entries thật, 5 domain) | `core/knowledge/data/*.json` | ✅ |
| Retrieval engine (offline-first, keyword) | `core/knowledge/retrieval.ts` | ✅ 11/11 |
| ZIP security (chống zip-slip, zip-bomb) | `core/security/zip-guard.ts` | ✅ 13/13 |
| Diagnostics rules (no-any, no-ts-ignore...) | `core/diagnostics/rules.ts` | ✅ 10/10 |
| Stack detection | `core/diagnostics/stack-detection.ts` | ✅ 7/7 |
| Memory scoring/prune | `core/memory/store.ts` | ✅ 9/9 |
| Agent loop guard (chống lặp vô hạn) | `core/agent/pipeline.ts` | ✅ 7/7 |
| File tools (path-traversal safe) | `core/agent/tools/*.ts` | ✅ 5/5 |
| JSON persistence | `lib/db.ts` | ✅ 7/7 |

## Đã viết, chưa build/chạy thử (cần bạn xác nhận)

- Toàn bộ UI Next.js (`app/`, `components/`)
- Toàn bộ API routes (`app/api/**`)
- `lib/zip.ts` (phụ thuộc `adm-zip`)

Chạy `./scripts/verify.sh` ở máy có network để tự xác nhận.

## Cấu trúc thư mục

```
hpgk-agent/
├── core/                  # Logic thuần, không phụ thuộc AI/UI/DB thật
│   ├── knowledge/         # Knowledge entries + retrieval engine
│   ├── security/          # ZIP guard (path traversal, zip bomb)
│   ├── diagnostics/       # Static rules + stack detection
│   ├── memory/            # Memory scoring/prune logic
│   ├── agent/             # Agent loop + tools
│   └── providers/         # AI provider interface + adapters
├── lib/                   # Adapter thật: JSON persistence, ZIP extraction
├── app/                   # Next.js App Router — pages + API routes
├── components/            # React components
├── styles/                # Design tokens
├── docs/                  # Tài liệu chi tiết từng hệ thống
├── scripts/verify.sh      # Chuỗi lệnh xác nhận thật
└── data/                  # Runtime storage (JSON files) — gitignored
```

## Tài liệu chi tiết

- [`docs/architecture.md`](docs/architecture.md) — sơ đồ tổng thể, vì sao chọn JSON thay vì Postgres ở v1
- [`docs/knowledge.md`](docs/knowledge.md) — cách thêm knowledge entry
- [`docs/retrieval.md`](docs/retrieval.md) — thuật toán retrieval
- [`docs/memory.md`](docs/memory.md) — memory architecture
- [`docs/agent.md`](docs/agent.md) — agent loop, guard, tool registry
- [`docs/zip-security.md`](docs/zip-security.md) — chi tiết các luật bảo mật ZIP
- [`docs/project-analysis.md`](docs/project-analysis.md) — luồng phân tích project sau upload
- [`docs/ui.md`](docs/ui.md) — cấu trúc trang, trạng thái wiring
- [`docs/design-system.md`](docs/design-system.md) — design tokens
- [`docs/testing.md`](docs/testing.md) — cách chạy test, nguyên tắc viết test
- [`docs/deployment.md`](docs/deployment.md) — hướng dẫn deploy Render/Vercel
- [`docs/verification-status.md`](docs/verification-status.md) — **đọc file này trước tiên**

## Giới hạn đã biết (không giấu diếm)

- Không có auth/user system (single-user)
- Không có rate limiting trên API routes
- Không có semantic/embedding retrieval (chỉ keyword — đúng yêu cầu offline-first)
- Không có streaming response cho chat
- Không có background job cho ZIP lớn (xử lý đồng bộ trong request)
- Chưa port cinematic intro animation từ prototype vào layer React
- Chưa có UI cho memory system (logic đã có, UI chưa có)

Xem `docs/verification-status.md` và từng file doc tương ứng để biết đầy
đủ phạm vi và giới hạn của từng hệ thống con.

## License

Chưa chọn license — thêm file `LICENSE` phù hợp trước khi public repo
nếu cần.
