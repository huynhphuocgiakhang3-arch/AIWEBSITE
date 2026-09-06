import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createJsonTable } from './db.ts';

interface Todo { id: string; title: string; done: boolean; }

async function tmpDataDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'hpgk-db-'));
}

test('insert + get: round-trips a record to real disk and back', async () => {
  const dir = await tmpDataDir();
  const table = createJsonTable<Todo>(dir, 'todos');
  await table.insert({ id: '1', title: 'Viết README', done: false });
  const found = await table.get('1');
  assert.deepEqual(found, { id: '1', title: 'Viết README', done: false });

  // xác nhận file THẬT sự tồn tại trên đĩa, không chỉ trong bộ nhớ
  const raw = await fs.readFile(path.join(dir, 'todos.json'), 'utf-8');
  assert.ok(JSON.parse(raw).length === 1);

  await fs.rm(dir, { recursive: true, force: true });
});

test('insert: rejects duplicate id instead of silently overwriting', async () => {
  const dir = await tmpDataDir();
  const table = createJsonTable<Todo>(dir, 'todos');
  await table.insert({ id: '1', title: 'A', done: false });
  await assert.rejects(() => table.insert({ id: '1', title: 'B', done: false }));
  await fs.rm(dir, { recursive: true, force: true });
});

test('update: patches only specified fields, preserves the rest', async () => {
  const dir = await tmpDataDir();
  const table = createJsonTable<Todo>(dir, 'todos');
  await table.insert({ id: '1', title: 'A', done: false });
  const updated = await table.update('1', { done: true });
  assert.deepEqual(updated, { id: '1', title: 'A', done: true });
  await fs.rm(dir, { recursive: true, force: true });
});

test('update: returns undefined for nonexistent id, does not throw', async () => {
  const dir = await tmpDataDir();
  const table = createJsonTable<Todo>(dir, 'todos');
  const result = await table.update('does-not-exist', { done: true });
  assert.equal(result, undefined);
  await fs.rm(dir, { recursive: true, force: true });
});

test('remove: deletes the record and reports true; false when not found', async () => {
  const dir = await tmpDataDir();
  const table = createJsonTable<Todo>(dir, 'todos');
  await table.insert({ id: '1', title: 'A', done: false });
  assert.equal(await table.remove('1'), true);
  assert.equal(await table.remove('1'), false);
  assert.deepEqual(await table.all(), []);
  await fs.rm(dir, { recursive: true, force: true });
});

test('all: on a table file that has never been written returns empty array, not an error', async () => {
  const dir = await tmpDataDir();
  const table = createJsonTable<Todo>(dir, 'never-touched');
  assert.deepEqual(await table.all(), []);
  await fs.rm(dir, { recursive: true, force: true });
});

test('replaceAll: overwrites the entire table contents', async () => {
  const dir = await tmpDataDir();
  const table = createJsonTable<Todo>(dir, 'todos');
  await table.insert({ id: '1', title: 'A', done: false });
  await table.insert({ id: '2', title: 'B', done: false });
  await table.replaceAll([{ id: '3', title: 'C', done: true }]);
  const all = await table.all();
  assert.equal(all.length, 1);
  assert.equal(all[0].id, '3');
  await fs.rm(dir, { recursive: true, force: true });
});
