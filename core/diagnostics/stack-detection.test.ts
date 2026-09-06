import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectStack } from './stack-detection.ts';

test('detectStack: identifies Next.js from package.json dependency', () => {
  const files = [{ path: 'package.json', content: JSON.stringify({ dependencies: { next: '14.0.0', react: '18.0.0' } }) }];
  const results = detectStack(files);
  assert.ok(results.some((r) => r.name === 'Next.js'));
  // Không double-count React riêng khi đã có Next.js
  assert.equal(results.some((r) => r.name === 'React'), false);
});

test('detectStack: identifies plain React when Next.js is absent', () => {
  const files = [{ path: 'package.json', content: JSON.stringify({ dependencies: { react: '18.0.0' } }) }];
  const results = detectStack(files);
  assert.ok(results.some((r) => r.name === 'React'));
});

test('detectStack: identifies Django from manage.py', () => {
  const files = [{ path: 'manage.py' }, { path: 'requirements.txt' }];
  const results = detectStack(files);
  assert.ok(results.some((r) => r.name === 'Django'));
});

test('detectStack: identifies Laravel from artisan file', () => {
  const files = [{ path: 'artisan' }, { path: 'composer.json' }];
  const results = detectStack(files);
  assert.ok(results.some((r) => r.name === 'Laravel'));
});

test('detectStack: handles malformed package.json without crashing', () => {
  const files = [{ path: 'package.json', content: '{ this is not valid json' }];
  assert.doesNotThrow(() => detectStack(files));
});

test('detectStack: empty file list returns empty result, does not guess', () => {
  const results = detectStack([]);
  assert.deepEqual(results, []);
});

test('detectStack: static HTML only when nothing else matches', () => {
  const files = [{ path: 'index.html' }, { path: 'style.css' }];
  const results = detectStack(files);
  assert.ok(results.some((r) => r.name === 'HTML/CSS/JS tĩnh'));
});
