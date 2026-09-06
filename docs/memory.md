# Memory Architecture

`core/memory/types.ts` + `core/memory/store.ts` — đã test 9/9
(`store.test.ts`).

## 6 loại memory (mục 14 spec gốc)

`conversation | project | user_preference | technical_decision | bug |
knowledge_usage` — tách biệt theo `MemoryType`, mỗi loại có thể được
truy hồi riêng qua `queryMemory(records, { type })`.

## 3 phạm vi (scope)

`global | project:<id> | conversation:<id>` — quyết định memory nào được
đưa vào context của một phiên cụ thể. Ví dụ: quyết định kỹ thuật
("dùng PostgreSQL cho production") nên là `global` hoặc `project`, không
nên là `conversation` (sẽ mất khi conversation đó kết thúc).

## Công thức "hữu ích" (`computeUsefulScore`)

```
score = (importance * 0.6 + confidence * 0.4) / 100 * decay(age)
decay(age) = 0.5 ^ (ageDays / 30)   // half-life 30 ngày
```

Một memory quan trọng (importance cao) nhưng lâu không được cập nhật vẫn
sẽ giảm dần điểm hữu ích — đúng tinh thần "không lưu mọi thứ" (mục 14):
memory cũ, ít dùng tới sẽ tự nhiên bị đẩy xuống dưới ngưỡng và bị prune.

## Prune (`selectRecordsToKeep`)

Hai cơ chế cắt tỉa:
1. Ngưỡng điểm tối thiểu (`minUsefulScore`, mặc định 0.08)
2. Giới hạn số lượng theo TỪNG scope (`maxRecordsPerScope`, mặc định 200)
   — độc lập giữa các scope khác nhau, project A đầy không ảnh hưởng tới
   quota của project B.

## `findDuplicates`

So sánh nội dung đã chuẩn hoá (lowercase, trim, gộp khoảng trắng) trong
CÙNG scope và CÙNG type — tránh lưu lặp cùng một sự thật diễn đạt khác
nhau một chút. Đây là gợi ý để review/gộp thủ công, KHÔNG tự động xoá.

## Điều CHƯA có (nói rõ)

- `store.ts` là logic THUẦN — chưa có adapter persistence thật nối vào
  `lib/db.ts` cho memory (mới có cho conversations/projects). Cần thêm
  `createJsonTable<MemoryRecord>(dataDir, 'memory')` + một cron/job định
  kỳ gọi `selectRecordsToKeep()` rồi `replaceAll()` kết quả.
- Chưa có UI hiển thị memory trong app (`app/` hiện chưa có trang
  `/memory`).
