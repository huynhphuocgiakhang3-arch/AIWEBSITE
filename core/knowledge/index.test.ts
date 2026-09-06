import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadKnowledgeBase } from './index.ts';
import { getKnowledgeStats } from './retrieval.ts';

test('loadKnowledgeBase: loads real shipped knowledge data with zero validation issues', async () => {
  const result = await loadKnowledgeBase();
  assert.equal(result.issues.length, 0, `Có vấn đề validation: ${JSON.stringify(result.issues, null, 2)}`);
  assert.ok(result.entries.length > 0);
});

test('loadKnowledgeBase: no duplicate ids across all domain files', async () => {
  const result = await loadKnowledgeBase();
  const ids = result.entries.map((e) => e.id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size);
});

test('loadKnowledgeBase: every "related" reference points to an id that actually exists', async () => {
  const result = await loadKnowledgeBase();
  const ids = new Set(result.entries.map((e) => e.id));
  const dangling: string[] = [];
  for (const entry of result.entries) {
    for (const relatedId of entry.related) {
      if (!ids.has(relatedId)) dangling.push(`${entry.id} -> ${relatedId}`);
    }
  }
  assert.equal(dangling.length, 0, `Dangling related references: ${dangling.join(', ')}`);
});

test('loadKnowledgeBase: real stats reflect actual file contents (honest numbers)', async () => {
  const result = await loadKnowledgeBase();
  const stats = getKnowledgeStats(result.entries);
  assert.equal(stats.totalEntries, result.entries.length);
  // Không có con số nào được bịa — tổng theo domain phải khớp tổng entries
  const sumByDomain = Object.values(stats.byDomain).reduce((a, b) => a + b, 0);
  assert.equal(sumByDomain, stats.totalEntries);
});

test('loadKnowledgeBase: rejects malformed entry instead of silently loading garbage', async () => {
  // Test này dùng thư mục giả lập riêng để không đụng vào data/ thật
  const os = await import('node:os');
  const path = await import('node:path');
  const fs = await import('node:fs/promises');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hpgk-kb-'));
  await fs.writeFile(
    path.join(tmpDir, 'broken.json'),
    JSON.stringify([{ id: 'ok-entry', domain: 'frontend', title: 'T', concept: 'C', why: 'W', how: 'H', when_to_use: [], when_not_to_use: [], best_practices: [], common_mistakes: [], related: [], confidence: 80 }, { id: 'bad-entry', title: 'Missing required fields' }])
  );
  const result = await loadKnowledgeBase(tmpDir);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].id, 'ok-entry');
  assert.ok(result.issues.some((i) => i.entryId === 'bad-entry'));
  await fs.rm(tmpDir, { recursive: true, force: true });
});
