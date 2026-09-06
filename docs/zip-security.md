# ZIP Security

`core/security/zip-guard.ts` — đã test 13/13 (`zip-guard.test.ts`),
BAO GỒM các payload tấn công thật: `../../etc/passwd`, đường dẫn tuyệt
đối Windows/Unix, symlink, tỉ lệ nén bất thường (zip bomb signal), vượt
giới hạn số lượng/tổng dung lượng entry.

## Chính sách fail-closed

`validateZipArchive()`: nếu BẤT KỲ entry nào trong ZIP vi phạm bất kỳ
luật nào, TOÀN BỘ archive bị từ chối — không âm thầm bỏ qua entry xấu và
tiếp tục xử lý phần còn lại. Test
`"whole-archive rejected if ANY entry is malicious"` xác nhận điều này.

## Các luật kiểm tra (theo thứ tự áp dụng)

1. **Absolute path** — entry có đường dẫn tuyệt đối bị từ chối ngay
2. **Suspicious filename pattern** — chứa `..`, đường dẫn Windows kiểu
   `C:\`, null byte
3. **Path traversal thật sự** — `path.resolve()` đường dẫn đích rồi kiểm
   tra nó còn nằm trong `targetDir` hay không (KHÔNG chỉ match chuỗi thô
   — đây là điểm khác biệt quan trọng so với nhiều implementation sai)
4. **Symlink** — từ chối hoàn toàn (an toàn nhất cho v1)
5. **Kích thước entry** — vượt `maxUncompressedEntrySize` (mặc định 50MB)
6. **Tỉ lệ nén bất thường** — vượt `maxCompressionRatio` (mặc định 200x),
   dấu hiệu zip bomb
7. **Extension whitelist** — nếu được cấu hình (mặc định không giới hạn)

Ở cấp archive: giới hạn `maxEntries` (5000) và
`maxTotalUncompressedSize` (500MB).

## Vì sao đọc metadata trước, giải nén sau

`lib/zip.ts` đọc toàn bộ central directory của ZIP (`readZipEntryMetas`)
để validate TRƯỚC KHI ghi bất kỳ byte nào ra đĩa. Việc này rẻ hơn nhiều
so với giải nén rồi mới phát hiện vấn đề — đúng như phân tích trong
knowledge entry `sec-zip-slip`.

## Giới hạn đã biết của `lib/zip.ts`

- ⚠️ CHƯA test thật (phụ thuộc `adm-zip`, chưa `npm install` được trong
  sandbox phát triển) — xem `docs/verification-status.md`.
- Phát hiện symlink dựa vào unix mode bit trong `header.attr` của
  adm-zip — cách này hoạt động với ZIP tạo trên Unix, CHƯA xác nhận với
  ZIP tạo trên Windows (thường không có symlink nên rủi ro thấp, nhưng
  cần lưu ý).
- Xử lý đồng bộ trong một request HTTP — ZIP rất lớn (gần giới hạn
  500MB) có thể gây timeout ở một số nền tảng hosting (Vercel serverless
  có giới hạn thời gian request). Cần chuyển sang background job nếu gặp
  vấn đề này trong thực tế.
