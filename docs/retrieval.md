# Retrieval Engine

`core/knowledge/retrieval.ts` — đã test 11/11 (`retrieval.test.ts`).

## Thuật toán

1. **Tokenize** (`tokenize()`): hạ chữ thường, chuẩn hoá Unicode NFC (quan
   trọng cho tiếng Việt có dấu), bỏ ký tự không phải chữ/số, loại
   stopword tiếng Việt/Anh cơ bản.
2. **Scoring** (`scoreEntry()`): với mỗi field có trọng số (title=3,
   concept=2, why/how=1.4, best_practices/common_mistakes=1,
   patterns/anti_patterns=0.8, tradeoffs=0.6), tính tỉ lệ token truy vấn
   xuất hiện trong field đó, nhân trọng số, cộng dồn, chuẩn hoá về [0,1].
3. **Ranking** (`retrieve()`): lọc theo domain (nếu có), lọc theo
   `minScore` (mặc định 0.05 — tránh trả về kết quả không liên quan gì),
   sắp xếp theo score giảm dần, hoà điểm thì ưu tiên `confidence` cao hơn.

## Vì sao trọng số field như vậy

Title khớp trực tiếp là tín hiệu mạnh nhất về việc entry đúng chủ đề
người dùng hỏi — trọng số 3. Các field diễn giải sâu (why/how) quan
trọng hơn ví dụ/đánh đổi (tradeoffs) vì chúng chứa nhiều khái niệm cốt
lõi hơn trên mỗi từ.

## Giới hạn đã biết

- Đây là keyword matching, KHÔNG hiểu ngữ nghĩa. Truy vấn đồng nghĩa
  nhưng không trùng từ khoá (ví dụ "tại sao web chậm" khi entry chỉ viết
  "performance") có thể không được tìm thấy nếu không có từ khoá chung.
- Không xử lý stemming/lemmatization tiếng Việt (ví dụ "chạy"/"chạy được"
  được coi là 2 token khác nhau).
- Đây là fallback offline-first bắt buộc phải luôn hoạt động — xem
  `docs/architecture.md` phần "đường nâng cấp lên semantic retrieval" nếu
  muốn bổ sung embedding search sau này.
