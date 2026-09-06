# Knowledge Core

## Vị trí dữ liệu

`core/knowledge/data/*.json` — mỗi file là một domain, chứa mảng các
entry theo schema `KnowledgeEntry` (`core/knowledge/types.ts`).

## Thống kê thật (chạy `npm test` hoặc tự đếm)

```bash
node --experimental-strip-types -e "
import('./core/knowledge/index.ts').then(async (m) => {
  const { entries } = await m.loadKnowledgeBase();
  console.log('Tổng entries:', entries.length);
  const byDomain = {};
  for (const e of entries) byDomain[e.domain] = (byDomain[e.domain] ?? 0) + 1;
  console.log(byDomain);
});
"
```

Tính đến khi viết tài liệu này: **15 entries** trên **5 domain** (frontend,
backend, database, security, ai-engineering). Đây là số liệu THẬT, không
phải "1.2M+" như trong ảnh concept UI ban đầu (ảnh đó là demo UI, không
phản ánh nội dung thật của hệ thống này).

## Cách thêm entry mới

1. Chọn đúng file domain trong `core/knowledge/data/`, hoặc tạo file mới
   nếu là domain chưa có (ví dụ `devops.json`).
2. Viết entry đầy đủ TẤT CẢ field trong `KnowledgeEntry` — không được để
   trống `why`/`how`/`concept` (đây là yêu cầu "không viết kiểu Wikipedia
   một dòng" trong spec gốc).
3. `id` phải duy nhất toàn hệ thống — `loadKnowledgeBase()` sẽ từ chối
   nạp entry có id trùng (đã test: `core/knowledge/index.test.ts`).
4. Nếu tham chiếu `related`, đảm bảo id đó tồn tại — có test tự động kiểm
   tra "dangling related reference".
5. Chạy `npm test` để xác nhận entry mới không phá vỡ validation.

## `confidence` nghĩa là gì (và không nghĩa là gì)

`confidence` (0-100) là mức độ tự tin CHỦ QUAN của người biên soạn khi
viết entry — dùng để phá thế hoà điểm khi retrieval trả về nhiều kết quả
điểm ngang nhau. Đây **KHÔNG PHẢI** một chỉ số đo lường tự động, và
KHÔNG được hiển thị trong UI như thể là "độ chính xác AI" — xem cảnh báo
ngay trong docstring của `KnowledgeEntry.confidence`.

## Vì sao dùng JSON tĩnh thay vì database cho knowledge

Theo mục 6 spec gốc: "Knowledge phải được đóng trực tiếp trong source" —
không phụ thuộc một API AI để chứa knowledge. JSON file trong source
control đáp ứng đúng yêu cầu này: review qua git diff, versioning tự
nhiên, không cần migration khi thêm entry.
