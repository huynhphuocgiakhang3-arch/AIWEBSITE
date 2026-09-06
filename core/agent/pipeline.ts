/**
 * core/agent/pipeline.ts
 *
 * Vòng lặp thực thi agent với guard cứng — implement trực tiếp knowledge
 * entry "ai-agent-loop-guards". Planner và Verifier được inject từ bên
 * ngoài (dependency injection) nên có thể test toàn bộ logic vòng lặp
 * bằng mock, KHÔNG cần gọi AI provider thật.
 */

import type {
  AgentTool,
  AgentStep,
  AgentRunResult,
  AgentGuardConfig,
  AgentPlanner,
  AgentVerifier,
} from './types.ts';
import { DEFAULT_AGENT_GUARD_CONFIG } from './types.ts';

function actionKey(action: AgentStep['action']): string {
  switch (action.type) {
    case 'respond':
      return `respond:${action.content}`;
    case 'tool':
      return `tool:${action.tool}:${action.input}`;
  }
}

export interface RunAgentOptions {
  tools: AgentTool[];
  planner: AgentPlanner;
  verifier: AgentVerifier;
  guardConfig?: Partial<AgentGuardConfig>;
  /** Cho phép inject "now" để test timeout mà không cần chờ thời gian thật */
  clock?: { now: () => number };
}

/**
 * Chạy vòng lặp agent: PLAN → TOOL/RESPOND → VERIFY, lặp lại tới khi verify
 * pass HOẶC chạm một trong các guard (max_iterations, timeout, repeated action).
 *
 * Nguyên tắc bắt buộc: succeeded chỉ true khi verifier thực sự trả về true.
 * Nếu vòng lặp dừng vì lý do khác, succeeded PHẢI là false — không được
 * "báo thành công" chỉ vì đã dừng.
 */
export async function runAgent(options: RunAgentOptions): Promise<AgentRunResult> {
  const guard: AgentGuardConfig = { ...DEFAULT_AGENT_GUARD_CONFIG, ...options.guardConfig };
  const clock = options.clock ?? { now: () => Date.now() };
  const startTime = clock.now();

  const steps: AgentStep[] = [];
  const actionCounts = new Map<string, number>();

  const toolMap = new Map(options.tools.map((t) => [t.name, t]));

  for (let iteration = 1; iteration <= guard.maxIterations; iteration++) {
    if (clock.now() - startTime > guard.timeoutMs) {
      return { steps, stopReason: 'timeout', succeeded: false };
    }

    const action = await options.planner(steps);
    const key = actionKey(action);
    const repeatCount = (actionCounts.get(key) ?? 0) + 1;
    actionCounts.set(key, repeatCount);

    if (repeatCount > guard.maxRepeatedAction) {
      return { steps, stopReason: 'repeated_action_detected', succeeded: false };
    }

    const step: AgentStep = { iteration, action, timestamp: new Date(clock.now()).toISOString() };

    if (action.type === 'respond') {
      step.result = action.content;
      steps.push(step);
    } else {
      const tool = toolMap.get(action.tool);
      if (!tool) {
        step.result = `Lỗi: không tìm thấy tool "${action.tool}"`;
        steps.push(step);
        continue;
      }
      try {
        step.result = await tool.run(action.input);
      } catch (err) {
        step.result = `Lỗi khi chạy tool "${action.tool}": ${err instanceof Error ? err.message : String(err)}`;
      }
      steps.push(step);
    }

    const verified = await options.verifier(steps);
    if (verified) {
      // Dùng thẳng `step` (đã biết chắc chắn là step vừa push) thay vì
      // steps[steps.length - 1] — tránh index access không an toàn kiểu
      // (noUncheckedIndexedAccess coi steps[n] là AgentStep | undefined).
      const finalResponse = step.action.type === 'respond' ? step.action.content : step.result;
      return { steps, stopReason: 'verified_success', succeeded: true, finalResponse };
    }
  }

  return { steps, stopReason: 'max_iterations_reached', succeeded: false };
}
