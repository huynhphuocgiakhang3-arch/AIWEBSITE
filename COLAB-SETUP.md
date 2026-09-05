# HPGK AGENT v0.6 — Colab Free

## Cách dùng

1. Mở `notebooks/colab/HPGK_AGENT_v0.6_Colab.ipynb` bằng Google Colab.
2. Vào **Runtime → Change runtime type → GPU** nếu GPU chưa được chọn.
3. Chạy từng cell từ trên xuống.
4. Đăng nhập Google khi Colab hỏi quyền Google Drive.
5. Notebook tự clone repo `AIWEBSITE` branch `main`.
6. Phiên đầu tiên train từ đầu; các phiên sau tự resume checkpoint trong Drive.

## Lưu ý $0

Colab Free không đảm bảo GPU liên tục và có thể ngắt phiên. Đây là lý do checkpoint được lưu ở Google Drive. Điện thoại/PC của bạn không phải chạy training.

## Dataset

Dữ liệu training nằm trong `ai/data/raw/`. Ưu tiên dữ liệu hợp pháp, chất lượng cao, tiếng Việt và tài liệu/code mà bạn có quyền sử dụng.

## Sau khi train

Checkpoint được lưu ở:

`Google Drive/MyDrive/HPGK-AGENT/checkpoints/hpgk-v0.6.pt`

Bước tiếp theo là đánh giá checkpoint và publish artifact/model; chưa tự động đưa checkpoint lên Vercel.


## V0.6 FIX
Notebook đã chặn lỗi dây chuyền: clone phải thành công trước dependencies; GPU phải bật trước training; hỗ trợ repo private bằng token nhập qua prompt; token được gỡ khỏi git remote sau clone.
