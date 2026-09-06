# HPGK v2.1 — MOBILE DEBUG

Bản này giữ nguyên HPGK v2.1 và thêm một bảng debug chạy trực tiếp trên trình duyệt.

## Dùng trên iPhone
1. Deploy bản này lên Vercel.
2. Mở website trên iPhone.
3. Nếu HPGK crash, bảng **HPGK DEBUG** màu đỏ sẽ tự hiện.
4. Chụp toàn bộ bảng lỗi và gửi ảnh cho ChatGPT.
5. Nếu muốn mở thủ công, bấm nút **HPGK DEBUG** ở góc dưới phải.

## Lưu ý
Nút `Xóa dữ liệu HPGK` sẽ xóa localStorage của origin hiện tại rồi reload. Chỉ dùng khi nghi dữ liệu chat/memory cũ gây lỗi.

Debug bắt:
- window.error
- unhandledrejection
- console.error
- message + stack trace
- một phần log gần nhất
