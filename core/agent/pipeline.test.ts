import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAgent } from './pipeline.ts';
import type { AgentTool, AgentStep } from './types.ts';

const noopTool: AgentTool = { name: 'noop', description: 'does nothing', run: () => 'ok' };

test('runAgent: succeeds when verifier passes on first respond action', async () => {
  const result = await runAgent({
    tools: [noopTool],
    planner: () => ({ type: 'respond', content: 'Xong rồi' }),
    verifier: (history) => history.length > 0,
  });
  assert.equal(result.succeeded, true);
  assert.equal(result.stopReason, 'verified_success');
  assert.equal(result.finalResponse, 'Xong rồi');
});

test('runAgent: does NOT report success when max_iterations is reached without verification passing', async () => {
  const result = await runAgent({
    tools: [noopTool],
    // Planner luôn trả về hành động khác nhau mỗi lần để tránh trigger repeat-guard trước
    planner: (history) => ({ tool: 'noop', input: `attempt-${history.length}` }),
    verifier: () => false, // KHÔNG BAO GIỜ pass
    guardConfig: { maxIterations: 5, maxRepeatedAction: 999 },
  });
  assert.equal(result.succeeded, false); // điểm mấu chốt: không được báo thành công
  assert.equal(result.stopReason, 'max_iterations_reached');
  assert.equal(result.steps.length, 5);
});

test('runAgent: detects repeated identical action and stops (does not loop forever)', async () => {
  const result = await runAgent({
    tools: [noopTool],
    planner: () => ({ tool: 'noop', input: 'same-input-always' }), // luôn giống hệt nhau
    verifier: () => false,
    guardConfig: { maxIterations: 100, maxRepeatedAction: 2 },
  });
  assert.equal(result.succeeded, false);
  assert.equal(result.stopReason, 'repeated_action_detected');
  // dừng sớm, không chạy hết 100 vòng
  assert.ok(result.steps.length <= 3);
});

test('runAgent: stops on timeout using injected clock (no real waiting)', async () => {
  let fakeNow = 0;
  const result = await runAgent({
    tools: [noopTool],
    planner: (history) => {
      fakeNow += 10_000; // mỗi vòng "trôi" 10 giây theo đồng hồ giả lập
      return { tool: 'noop', input: `step-${history.length}` };
    },
    verifier: () => false,
    guardConfig: { maxIterations: 100, timeoutMs: 25_000, maxRepeatedAction: 999 },
    clock: { now: () => fakeNow },
  });
  assert.equal(result.succeeded, false);
  assert.equal(result.stopReason, 'timeout');
});

test('runAgent: calls the correct tool and captures its result', async () => {
  const echoTool: AgentTool = { name: 'echo', description: 'echoes input', run: (input) => `echo:${input}` };
  let called = false;
  const result = await runAgent({
    tools: [echoTool],
    planner: (history) => {
      if (history.length === 0) return { tool: 'echo', input: 'hello' };
      return { type: 'respond', content: 'done' };
    },
    verifier: (history) => {
      const last = history[history.length - 1];
      if ('type' in last.action && last.action.type === 'respond') {
        called = true;
        return true;
      }
      return false;
    },
  });
  assert.equal(result.steps[0].result, 'echo:hello');
  assert.equal(called, true);
  assert.equal(result.succeeded, true);
});

test('runAgent: unknown tool name produces an error result instead of crashing', async () => {
  const result = await runAgent({
    tools: [noopTool],
    planner: () => ({ tool: 'does-not-exist', input: 'x' }),
    verifier: () => true, // verify pass ngay sau bước đầu để test kết thúc gọn
  });
  assert.ok(result.steps[0].result?.includes('không tìm thấy tool'));
});

test('runAgent: tool that throws does not crash the whole pipeline', async () => {
  const throwingTool: AgentTool = {
    name: 'boom',
    description: 'always throws',
    run: () => { throw new Error('kaboom'); },
  };
  const result = await runAgent({
    tools: [throwingTool],
    planner: () => ({ tool: 'boom', input: 'x' }),
    verifier: () => true,
  });
  assert.ok(result.steps[0].result?.includes('Lỗi khi chạy tool'));
  assert.ok(result.steps[0].result?.includes('kaboom'));
});
