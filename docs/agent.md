# Agent Architecture

`core/agent/pipeline.ts` — đã test 7/7 (`pipeline.test.ts`), bao gồm test
timeout bằng đồng hồ giả lập (không cần chờ thời gian thật) và test phát
hiện lặp hành động giống hệt nhau.

## Nguyên tắc bắt buộc (mục 20 spec gốc)

> "Không báo thành công nếu chưa verify."

`AgentRunResult.succeeded` CHỈ được `true` khi `stopReason ===
'verified_success'` — tức verifier do caller cung cấp thực sự trả về
`true`. Ba lý do dừng còn lại (`max_iterations_reached`, `timeout`,
`repeated_action_detected`) LUÔN đi kèm `succeeded: false`. Test
`pipeline.test.ts` dòng "does NOT report success when max_iterations is
reached" xác nhận trực tiếp điều này.

## Dependency injection — vì sao planner/verifier là tham số

`runAgent()` nhận `planner` và `verifier` như tham số thay vì gọi cứng
một AI provider bên trong. Điều này cho phép:

1. Test toàn bộ logic vòng lặp (guard, timeout, repeat-detection) bằng
   mock planner/verifier — KHÔNG cần gọi AI thật, KHÔNG tốn API cost khi
   chạy test, KHÔNG cần network trong CI.
2. Ở tầng ứng dụng thật, `planner` sẽ là một hàm gọi
   `core/providers/anthropic-provider.ts` để model quyết định hành động
   tiếp theo dựa trên lịch sử — hàm này CHƯA được viết trong v1 (xem
   phần "Chưa có" bên dưới).

## Tool registry

`core/agent/tools/registry.ts` — danh sách tool phải đăng ký tường minh,
không có cơ chế "tự khám phá" tool ẩn. 4 tool đã implement:

- `search_knowledge` — nối `core/knowledge/retrieval.ts`
- `run_diagnostics` — nối `core/diagnostics/rules.ts`
- `read_file` / `write_file` — giới hạn trong workspace của MỘT project,
  dùng `resolveSafe()` (cùng nguyên tắc resolve+startsWith như zip-guard)

## Guard config mặc định

```ts
{ maxIterations: 12, timeoutMs: 60_000, maxRepeatedAction: 2 }
```

Có thể override qua `guardConfig` khi gọi `runAgent()`. Số 12/60s/2 là
lựa chọn khởi điểm hợp lý, CHƯA được tinh chỉnh dựa trên dữ liệu sử dụng
thật (chưa có hệ thống nào chạy production để thu thập số liệu đó).

## Chưa có — cần làm tiếp trước khi agent "thật" hoạt động end-to-end

- **Chưa có hàm nối `planner` thật với AI provider.** Cần viết một hàm
  dạng `createAnthropicPlanner(provider, tools, systemPrompt)` biến lịch
  sử `AgentStep[]` thành prompt, gọi `provider.complete()`, parse response
  thành `AgentStep['action']` (structured output hoặc tool-calling format
  của Anthropic API).
- Chưa có `verifier` thật cho các tác vụ cụ thể (ví dụ: "sửa lỗi TypeScript"
  → verifier chạy lại `run_diagnostics` và kiểm tra issue đó đã biến mất).
- Chưa nối `runAgent()` vào một API route (`/api/agent/run` chưa tồn tại
  — hiện `/api/chat` chỉ gọi thẳng `provider.complete()` một lần, CHƯA
  dùng agent loop đầy đủ).
