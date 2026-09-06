/**
 * core/agent/types.ts
 * Theo pipeline mục 13 spec gốc: USER → INTENT → CONTEXT → KNOWLEDGE →
 * PLAN → TOOLS → EXECUTION → TEST → VERIFY → SELF REVIEW → RESPONSE
 */

export interface AgentTool {
  name: string;
  description: string;
  /** Thực thi tool, trả về kết quả dạng chuỗi (đơn giản hoá cho v1) */
  run: (input: string) => Promise<string> | string;
}

export interface AgentStep {
  iteration: number;
  /**
   * Discriminated union THẬT (cả 2 nhánh đều có field `type`) — tránh
   * dựa vào suy luận `'type' in action` mong manh giữa một type CÓ field
   * `type` và một type KHÔNG có field nào tên `type`. TypeScript's `in`
   * narrowing giữa hai object type không cùng discriminant rõ ràng có
   * thể không thu hẹp được như mong đợi ở một số trường hợp — dùng
   * discriminated union tường minh loại bỏ hoàn toàn sự mơ hồ đó.
   */
  action: { type: 'tool'; tool: string; input: string } | { type: 'respond'; content: string };
  result?: string;
  timestamp: string;
}

export type AgentStopReason =
  | 'verified_success'
  | 'max_iterations_reached'
  | 'timeout'
  | 'repeated_action_detected'
  | 'no_tool_needed';

export interface AgentRunResult {
  steps: AgentStep[];
  stopReason: AgentStopReason;
  /**
   * true CHỈ KHI điều kiện verify thực sự pass — KHÔNG được true chỉ vì
   * agent dừng do chạm giới hạn. Đây là điểm mấu chốt của mục 20 spec gốc:
   * "Không báo thành công nếu chưa verify."
   */
  succeeded: boolean;
  finalResponse?: string;
}

export interface AgentGuardConfig {
  maxIterations: number;
  timeoutMs: number;
  /** Số lần lặp lại cùng một hành động (tool+input giống hệt) trước khi bị coi là kẹt vòng lặp */
  maxRepeatedAction: number;
}

export const DEFAULT_AGENT_GUARD_CONFIG: AgentGuardConfig = {
  maxIterations: 12,
  timeoutMs: 60_000,
  maxRepeatedAction: 2,
};

/**
 * Hàm quyết định kế hoạch tiếp theo dựa trên lịch sử các bước đã thực hiện.
 * Đây là điểm nối với AI provider thật (planner do model quyết định) —
 * trong core logic, đây chỉ là một interface để có thể test bằng mock planner
 * không cần gọi AI thật.
 */
export type AgentPlanner = (history: AgentStep[]) => Promise<AgentStep['action']> | AgentStep['action'];

/** Hàm kiểm tra xem tác vụ đã thực sự hoàn thành đúng yêu cầu hay chưa. */
export type AgentVerifier = (history: AgentStep[]) => Promise<boolean> | boolean;
