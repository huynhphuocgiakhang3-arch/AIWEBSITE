import type { AgentTool } from '../types.ts';

/**
 * Tool registry đơn giản — danh sách tool khả dụng cho agent trong một
 * phiên chạy. Không có "magic" ẩn: mỗi tool phải được đăng ký tường minh.
 */
export function createToolRegistry(tools: AgentTool[]): {
  list: () => AgentTool[];
  get: (name: string) => AgentTool | undefined;
} {
  const map = new Map(tools.map((t) => [t.name, t]));
  return {
    list: () => Array.from(map.values()),
    get: (name: string) => map.get(name),
  };
}
