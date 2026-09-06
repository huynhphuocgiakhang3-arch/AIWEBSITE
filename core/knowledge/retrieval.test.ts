import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, scoreEntry, retrieve, getRelated, getKnowledgeStats } from './retrieval.ts';
import type { KnowledgeEntry } from './types.ts';

function makeEntry(overrides: Partial<KnowledgeEntry>): KnowledgeEntry {
  return {
    id: 'test-entry',
    domain: 'frontend',
    title: 'Test Entry',
    concept: '',
    why: '',
    how: '',
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

test('tokenize: lowercases, strips punctuation, drops stopwords', () => {
  const tokens = tokenize('N+1 Query Problem là gì?');
  assert.ok(tokens.includes('query'));
  assert.ok(tokens.includes('problem'));
  assert.ok(!tokens.includes('la')); // stopword tiếng Việt bị loại
});

test('tokenize: handles Vietnamese diacritics without crashing', () => {
  const tokens = tokenize('Stacking context của CSS trong React');
  assert.ok(tokens.length > 0);
  assert.ok(tokens.includes('stacking'));
});

test('scoreEntry: exact title match scores higher than no match', () => {
  const entry = makeEntry({ title: 'N+1 Query Problem', concept: 'Vấn đề truy vấn N+1 trong database' });
  const highMatch = scoreEntry(entry, tokenize('N+1 query problem'));
  const noMatch = scoreEntry(entry, tokenize('unrelated random words xyz'));
  assert.ok(highMatch.score > noMatch.score);
  assert.ok(highMatch.matchedFields.includes('title'));
});

test('scoreEntry: empty query tokens returns zero score, not NaN', () => {
  const entry = makeEntry({ title: 'Anything' });
  const result = scoreEntry(entry, []);
  assert.equal(result.score, 0);
  assert.equal(Number.isNaN(result.score), false);
});

test('retrieve: filters by domain when specified', () => {
  const entries = [
    makeEntry({ id: 'a', domain: 'frontend', title: 'CSS stacking context' }),
    makeEntry({ id: 'b', domain: 'backend', title: 'CSS stacking context but backend' }),
  ];
  const results = retrieve(entries, { text: 'stacking context', domain: 'frontend' });
  assert.equal(results.length, 1);
  assert.equal(results[0].entry.id, 'a');
});

test('retrieve: respects limit', () => {
  const entries = Array.from({ length: 10 }, (_, i) =>
    makeEntry({ id: `e${i}`, title: 'idempotency key backend api' })
  );
  const results = retrieve(entries, { text: 'idempotency key', limit: 3 });
  assert.equal(results.length, 3);
});

test('retrieve: results sorted by score descending', () => {
  const entries = [
    makeEntry({ id: 'weak', title: 'something else', concept: 'mentions rate limiting once' }),
    makeEntry({ id: 'strong', title: 'rate limiting token bucket', concept: 'rate limiting sliding window rate limiting' }),
  ];
  const results = retrieve(entries, { text: 'rate limiting token bucket sliding window' });
  assert.ok(results.length >= 1);
  for (let i = 1; i < results.length; i++) {
    assert.ok(results[i - 1].score >= results[i].score);
  }
});

test('retrieve: irrelevant query returns empty array, does not force a result', () => {
  const entries = [makeEntry({ id: 'a', title: 'CSS stacking context' })];
  const results = retrieve(entries, { text: 'quantum physics recipe for pho' });
  assert.equal(results.length, 0);
});

test('getRelated: returns entries listed in related[], ignores unknown ids gracefully', () => {
  const entries = [
    makeEntry({ id: 'a', related: ['b', 'nonexistent'] }),
    makeEntry({ id: 'b' }),
  ];
  const related = getRelated(entries, 'a');
  assert.equal(related.length, 1);
  assert.equal(related[0].id, 'b');
});

test('getRelated: unknown source id returns empty array (no crash)', () => {
  const entries = [makeEntry({ id: 'a' })];
  assert.deepEqual(getRelated(entries, 'does-not-exist'), []);
});

test('getKnowledgeStats: reports real counts, not fabricated numbers', () => {
  const entries = [
    makeEntry({ id: 'a', domain: 'frontend' }),
    makeEntry({ id: 'b', domain: 'frontend' }),
    makeEntry({ id: 'c', domain: 'backend' }),
  ];
  const stats = getKnowledgeStats(entries);
  assert.equal(stats.totalEntries, 3);
  assert.equal(stats.domains, 2);
  assert.equal(stats.byDomain.frontend, 2);
  assert.equal(stats.byDomain.backend, 1);
});
