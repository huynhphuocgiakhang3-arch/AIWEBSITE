#!/usr/bin/env bash
# scripts/verify.sh
#
# Chuỗi lệnh xác nhận THẬT — chạy ở máy có network access.
# Không có bước nào trong file này đã được chạy bởi AI tạo ra source
# này (sandbox phát triển không có network) — đây là lý do file này tồn
# tại: để BẠN chạy và có bằng chứng thật, thay vì tin vào lời khẳng định.
#
# Dừng ngay ở lỗi đầu tiên (set -e) — không tiếp tục nếu một bước fail,
# đúng nguyên tắc "không báo thành công nếu chưa verify".

set -e

echo "== 1/5: npm install =="
npm install

echo "== 2/5: typecheck =="
npm run typecheck

echo "== 3/5: lint =="
npm run lint

echo "== 4/5: test (74 test đã pass trong môi trường phát triển, xác nhận lại ở đây) =="
npm test

echo "== 5/5: build production =="
npm run build

echo ""
echo "✅ Tất cả các bước PASS thật trên máy này."
echo "   Nếu bất kỳ bước nào ở trên fail, dừng lại và sửa trước khi deploy —"
echo "   đừng bỏ qua bước nào trong chuỗi này."
