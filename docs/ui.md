# UI

## Cấu trúc trang (App Router)

| Route | File | Trạng thái |
|---|---|---|
| `/` | `app/page.tsx` | Chat — wired thật vào `/api/chat` |
| `/projects` | `app/projects/page.tsx` | Danh sách + tạo project — wired thật |
| `/projects/[id]` | `app/projects/[id]/page.tsx` | Upload ZIP, xem stack, chạy diagnostics, export — wired thật |
| `/knowledge` | `app/knowledge/page.tsx` | Tìm kiếm Knowledge Core — wired thật vào `/api/knowledge/search` |
| `/files` | `app/files/page.tsx` | File tree + code viewer theo project — wired thật |
| `/settings` | `app/settings/page.tsx` | Trạng thái AI provider/knowledge/storage thật (đọc `process.env`) |

Tất cả các trang trên đều gọi API route thật, không có trang nào hiển
thị dữ liệu giả/mock.

## Component tái sử dụng

- `components/chat/Composer.tsx`, `MessageList.tsx`
- `components/knowledge/KnowledgeSearch.tsx`
- `components/files/FileTree.tsx`, `CodeViewer.tsx`

## Còn thiếu so với spec gốc

- Không có trang `/memory` (memory logic đã có ở `core/`, chưa có UI)
- Không có conversation history sidebar (mới có `/api/conversations`
  trả về danh sách, chưa có component hiển thị nó trong `app/page.tsx`)
- Không có cinematic intro sequence trong layer React (xem
  `docs/design-system.md`)
- Component hiện dùng inline style (`style={{...}}`) thay vì CSS module
  hoặc Tailwind — chấp nhận được cho v1 nhưng nên refactor nếu component
  library phát triển lớn hơn, để tránh trùng lặp giá trị token bằng tay
