import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeUsefulScore, selectRecordsToKeep, findDuplicates, queryMemory } from './store.ts';
import type { MemoryRecord } from './types.ts';

function makeRecord(overrides: Partial<MemoryRecord>): MemoryRecord {
  const now = new Date().toISOString();
  return {
    id: 'm1',
    type: 'technical_decision',
    content: 'Dùng PostgreSQL cho production',
    scope: { kind: 'global' },
    importance: 80,
    confidence: 90,
    createdAt: now,
    updatedAt: now,
    source: 'chat',
    ...overrides,
  };
}

test('computeUsefulScore: fresh high-importance record scores high', () => {
  const record = makeRecord({ importance: 90, confidence: 90 });
  const score = computeUsefulScore(record, new Date());
  assert.ok(score > 0.8);
});

test('computeUsefulScore: decays over time (30 days ~= half)', () => {
  const created = new Date('2026-01-01T00:00:00Z');
  const in30Days = new Date('2026-01-31T00:00:00Z');
  const record = makeRecord({ importance: 100, confidence: 100, updatedAt: created.toISOString() });
  const freshScore = computeUsefulScore(record, created);
  const decayedScore = computeUsefulScore(record, in30Days);
  assert.ok(decayedScore < freshScore);
  assert.ok(Math.abs(decayedScore / freshScore - 0.5) < 0.02);
});

test('computeUsefulScore: never negative, never above 1', () => {
  const record = makeRecord({ importance: 0, confidence: 0 });
  const veryOld = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3650); // +10 năm
  const score = computeUsefulScore(record, veryOld);
  assert.ok(score >= 0 && score <= 1);
});

test('selectRecordsToKeep: drops records below minUsefulScore threshold', () => {
  const records = [
    makeRecord({ id: 'high', importance: 90, confidence: 90 }),
    makeRecord({ id: 'low', importance: 1, confidence: 1 }),
  ];
  const kept = selectRecordsToKeep(records, { minUsefulScore: 0.3 });
  assert.ok(kept.some((r) => r.id === 'high'));
  assert.equal(kept.some((r) => r.id === 'low'), false);
});

test('selectRecordsToKeep: enforces per-scope cap even if all records score high', () => {
  const records = Array.from({ length: 10 }, (_, i) =>
    makeRecord({ id: `r${i}`, importance: 95, confidence: 95 })
  );
  const kept = selectRecordsToKeep(records, { maxRecordsPerScope: 3, minUsefulScore: 0 });
  assert.equal(kept.length, 3);
});

test('selectRecordsToKeep: caps are independent per scope', () => {
  const records = [
    ...Array.from({ length: 5 }, (_, i) => makeRecord({ id: `g${i}`, scope: { kind: 'global' } })),
    ...Array.from({ length: 5 }, (_, i) => makeRecord({ id: `p${i}`, scope: { kind: 'project', projectId: 'p1' } })),
  ];
  const kept = selectRecordsToKeep(records, { maxRecordsPerScope: 2, minUsefulScore: 0 });
  assert.equal(kept.length, 4); // 2 per scope * 2 scopes
});

test('findDuplicates: detects same content in same scope+type', () => {
  const records = [
    makeRecord({ id: 'a', content: 'Dùng PostgreSQL cho production' }),
    makeRecord({ id: 'b', content: '  dùng postgresql cho production  ' }), // khác hoa/thường + khoảng trắng
  ];
  const dups = findDuplicates(records);
  assert.equal(dups.length, 1);
});

test('findDuplicates: does NOT flag same content in different scopes as duplicate', () => {
  const records = [
    makeRecord({ id: 'a', content: 'Same text', scope: { kind: 'project', projectId: 'p1' } }),
    makeRecord({ id: 'b', content: 'Same text', scope: { kind: 'project', projectId: 'p2' } }),
  ];
  const dups = findDuplicates(records);
  assert.equal(dups.length, 0);
});

test('queryMemory: filters by type and scope, sorted by usefulness', () => {
  const records = [
    makeRecord({ id: 'a', type: 'bug', importance: 30, confidence: 30 }),
    makeRecord({ id: 'b', type: 'bug', importance: 90, confidence: 90 }),
    makeRecord({ id: 'c', type: 'technical_decision', importance: 99, confidence: 99 }),
  ];
  const results = queryMemory(records, { type: 'bug' });
  assert.equal(results.length, 2);
  assert.equal(results[0].id, 'b'); // điểm cao hơn đứng trước
});
