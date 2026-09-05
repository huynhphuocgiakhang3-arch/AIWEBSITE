# HPGK AGENT v2.1.1 — AGENT + RAG CORE

HPGK v2.1.1 chuyển từ knowledge browser thành nền tảng Agent/RAG có thể mở rộng.

- Retrieval: exact phrase + title/term scoring + lazy knowledge packs.
- Context: knowledge, project, file và memory có thể ghép thành một context.
- ZIP: kiểm tra dung lượng/số entry, lập chỉ mục cấu trúc mà không thực thi code.
- Self-check API: kiểm tra cơ bản bằng chứng và các khẳng định tuyệt đối.
- Performance: UI render độc lập; knowledge packs chỉ đọc khi cần; index/cache phía server.
- UI: Vietnamese-first, premium dark workspace.

Đây vẫn là core không phụ thuộc AI API. Muốn sinh câu trả lời tự nhiên cần nối một model provider ở lớp riêng.
