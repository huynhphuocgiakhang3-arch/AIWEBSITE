import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runIngestion } from './ingestion.ts';
import type { KnowledgeEntry } from './types.ts';

function makeEntry(overrides: Partial<KnowledgeEntry>): KnowledgeEntry {
  return {
    id: 'e1',
    domain: 'frontend',
    title: 'Test Entry',
    concept: 'concept text',
    why: 'why text',
    how: 'how text',
    when_to_use: [],
    when_not_to_use: [],
    prerequisites: [],
    best_practices: [],
    patterns: [],
    anti_patterns: [],
    common_mistakes: [],
    failure_modes: [],
    debugging: [],
    security: [],
    performance: [],
    accessibility: [],
    examples: [],
    tradeoffs: [],
    related: [],
    confidence: 80,
    provenance: ['curated'],
    version: '1.0',
    ...overrides,
  };
}

test('runIngestion: processes every entry and reports accurate final counts', async () => {
  const entries = [
    makeEntry({ id: 'a', title: 'Stacking context CSS' }),
    makeEntry({ id: 'b', title: 'N+1 query database' }),
  ];
  const result = await runIngestion({ entries });
  assert.equal(result.aborted, false);
  assert.equal(result.entriesProcessed, 2);
  assert.equal(result.totalEntries, 2);
  assert.ok(result.uniqueTokens > 0);
});

test('runIngestion: index actually maps real tokens to real entry ids (not fabricated)', async () => {
  const entries = [
    makeEntry({ id: 'zipslip', title: 'Zip Slip path traversal', concept: 'giải nén an toàn' }),
  ];
  const result = await runIngestion({ entries });
  assert.ok(result.index['zip']?.includes('zipslip'));
  assert.ok(result.index['slip']?.includes('zipslip'));
  assert.ok(result.index['path']?.includes('zipslip'));
});

test('runIngestion: emits progress events with real, monotonically increasing processedCount', async () => {
  const entries = [makeEntry({ id: 'a' }), makeEntry({ id: 'b' }), makeEntry({ id: 'c' })];
  const events: number[] = [];
  await runIngestion({
    entries,
    onProgress: (e) => {
      if (e.phase === 'indexing') events.push(e.processedCount);
    },
  });
  assert.deepEqual(events, [1, 2, 3]);
});

test('runIngestion: emits a final "done" event only when NOT aborted', async () => {
  const entries = [makeEntry({ id: 'a' })];
  let sawDone = false;
  await runIngestion({
    entries,
    onProgress: (e) => {
      if (e.phase === 'done') sawDone = true;
    },
  });
  assert.equal(sawDone, true);
});

test('runIngestion: GENUINELY stops mid-run when aborted — does not finish all entries', async () => {
  const entries = Array.from({ length: 20 }, (_, i) => makeEntry({ id: `e${i}`, title: `Entry number ${i}` }));
  const controller = new AbortController();

  let processedBeforeAbort = 0;
  const result = await runIngestion({
    entries,
    signal: controller.signal,
    stepDelayMs: 5,
    onProgress: (e) => {
      processedBeforeAbort = e.processedCount;
      // Dừng thật giữa chừng sau khi xử lý được 3 entry — mô phỏng người
      // dùng bấm nút Dừng khi thấy tiến trình đang chạy.
      if (e.processedCount === 3 && e.phase === 'indexing') {
        controller.abort();
      }
    },
  });

  assert.equal(result.aborted, true);
  // Bằng chứng THẬT của việc dừng: không xử lý hết 20 entry.
  assert.ok(result.entriesProcessed < entries.length);
  assert.ok(result.entriesProcessed >= 3);
  assert.equal(processedBeforeAbort < entries.length, true);
});

test('runIngestion: aborting BEFORE any processing starts returns zero processed, not a crash', async () => {
  const entries = [makeEntry({ id: 'a' }), makeEntry({ id: 'b' })];
  const controller = new AbortController();
  controller.abort(); // đã abort ngay từ đầu, trước khi gọi runIngestion

  const result = await runIngestion({ entries, signal: controller.signal });
  assert.equal(result.aborted, true);
  assert.equal(result.entriesProcessed, 0);
});

test('runIngestion: empty entries list completes immediately as done, not aborted', async () => {
  const result = await runIngestion({ entries: [] });
  assert.equal(result.aborted, false);
  assert.equal(result.entriesProcessed, 0);
  assert.equal(result.totalEntries, 0);
});

test('runIngestion: durationMs reflects real elapsed time (not zero/fabricated) when stepDelayMs is used', async () => {
  const entries = [makeEntry({ id: 'a' }), makeEntry({ id: 'b' })];
  const result = await runIngestion({ entries, stepDelayMs: 20 });
  // 2 entries * 20ms delay mỗi entry = tối thiểu ~40ms trôi qua thật
  assert.ok(result.durationMs >= 35, `durationMs quá thấp: ${result.durationMs}`);
});
