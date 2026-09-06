# Project Analysis (ZIP → Understanding)

Xem `docs/zip-security.md` cho phần an toàn. Tài liệu này mô tả phần
"hiểu project" sau khi giải nén an toàn.

## Luồng hiện tại

```
ZIP an toàn đã giải nén vào workspaceDir
  → detectStack() [core/diagnostics/stack-detection.ts]
  → lưu vào ProjectRecord.detectedStack
```

## `detectStack` nhận diện gì (đã test 7/7)

Next.js, React (khi không có Next.js), Vue, Vite, Express, Prisma,
Python (qua `requirements.txt`), Django (qua `manage.py`), FastAPI
(heuristic yếu — chỉ đoán qua `main.py` + `requirements.txt`, ghi rõ
"có thể" trong tên kết quả), PHP (`composer.json`), Laravel (`artisan`),
HTML/CSS/JS tĩnh (fallback khi không có gì khác khớp).

Mỗi kết quả kèm `confidence: 'high' | 'medium'` VÀ `evidence: string[]`
cụ thể (ví dụ: "package.json có dependency next") — không có con số phần
trăm mơ hồ không giải thích được từ đâu ra.

## Giới hạn đã biết

- Chỉ đọc `package.json` ở gốc hoặc cấp `*/package.json` gần gốc — chưa
  xử lý monorepo phức tạp (nhiều package.json lồng nhau, workspaces).
- Không phân tích dependency graph sâu (chỉ kiểm tra tên package có tồn
  tại trong `dependencies`/`devDependencies` hay không, không kiểm tra
  version, không phát hiện conflict).
- Không có "architecture map" như mô tả trong spec gốc mục 17 (sơ đồ
  quan hệ giữa các module) — đây là việc lớn hơn nhiều so với stack
  detection, chưa được implement trong v1.
- Không có source indexing/full-text search trên toàn bộ project (mới
  có file tree + xem từng file riêng lẻ qua `/files`).

## Nối với Diagnostics

Sau khi có file tree, `/api/diagnostics?projectId=...` chạy
`analyzeFiles()` (core/diagnostics/rules.ts, đã test 10/10) trên toàn bộ
file `.ts/.tsx/.js/.jsx/.json/.md/.env` trong workspace (giới hạn
500KB/file, bỏ qua `node_modules` và `.git`).
