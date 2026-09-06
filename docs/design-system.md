# Design System

## Nguồn sự thật: `styles/tokens.css`

Toàn bộ màu sắc, spacing, motion phải dùng `var(--hpgk-*)` — không
hardcode giá trị trực tiếp trong component (mục 23 spec gốc: "Không
hardcode cùng một giá trị hàng chục lần").

## Nguồn gốc token

Token được port trực tiếp từ prototype UI đã xây dựng và duyệt trước khi
chuyển sang kiến trúc source chính thức này (dark space, electric blue,
violet, cyan theo đúng chỉ định thị giác trong spec gốc mục 2).

## Bảng token chính

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--hpgk-bg` | `#05060c` | Nền toàn app |
| `--hpgk-surface` | `#0b0e1a` | Sidebar, panel |
| `--hpgk-surface-elevated` | `#121527` | Card, input, composer |
| `--hpgk-primary` | `#5b7cfa` | Nút hành động chính, gradient |
| `--hpgk-accent` | `#8b6cf0` | Gradient thứ hai |
| `--hpgk-cyan` | `#4fd1e8` | Nhấn nhá (domain label, subword) |
| `--hpgk-text` / `--hpgk-muted` / `--hpgk-muted-2` | — | Phân cấp độ đậm nhạt của chữ |
| `--radius-s/m/l` | 8/14/20px | Bo góc theo cấp độ kích thước phần tử |
| `--z-topbar/sidebar/mobile-nav/modal/toast` | — | Thang z-index tập trung — xem knowledge entry `fe-css-stacking-context` để hiểu vì sao cần tập trung thay vì rải rác |

## Typography

- **Space Grotesk** (500/600/700) — heading, wordmark, số liệu nổi bật
- **Inter** (400/500/600) — toàn bộ body text, UI copy

Cả hai đều hỗ trợ subset tiếng Việt qua Google Fonts (API css2 tự phục
vụ đúng subset cần thiết dựa trên nội dung trang, không cần khai báo
`&subset=vietnamese` thủ công).

## Trạng thái polish so với prototype cinematic ban đầu

Prototype HTML trước đó (đã gửi ở lượt trước) có: intro cinematic
particle animation, logo reveal sequence, canvas starfield tối ưu hiệu
năng (giảm hạt trên mobile, dừng khi tab ẩn). **Phần này CHƯA được port
vào layer React** (`app/layout.tsx` hiện là layout tĩnh, không có intro
sequence). Đây là việc còn lại nếu muốn giữ đúng trải nghiệm "first
impression" mô tả ở mục 3 spec gốc.

## Responsive

Breakpoint chính: `860px` (`app/globals.css`). Dưới ngưỡng này: sidebar
và side-panel ẩn, thay bằng `mobile-nav` cố định ở đáy màn hình — đúng
nguyên tắc mục 22 spec gốc ("Mobile không phải desktop thu nhỏ"), dù
hiện tại mobile nav mới dừng ở điều hướng cơ bản, chưa có bottom sheet/
swipe interaction như mô tả đầy đủ trong spec.
