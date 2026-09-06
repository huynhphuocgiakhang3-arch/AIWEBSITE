import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createReadFileTool } from './read-file.ts';
import { createWriteFileTool } from './write-file.ts';

async function makeTempWorkspace(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'hpgk-ws-'));
}

test('write_file then read_file round-trips content correctly', async () => {
  const ws = await makeTempWorkspace();
  const writeTool = createWriteFileTool(ws);
  const readTool = createReadFileTool(ws);

  const writeResult = await writeTool.run(JSON.stringify({ path: 'src/hello.txt', content: 'xin chào' }));
  assert.ok(writeResult.includes('Đã ghi'));

  const readResult = await readTool.run('src/hello.txt');
  assert.equal(readResult, 'xin chào');

  await fs.rm(ws, { recursive: true, force: true });
});

test('write_file creates nested directories automatically', async () => {
  const ws = await makeTempWorkspace();
  const writeTool = createWriteFileTool(ws);
  await writeTool.run(JSON.stringify({ path: 'a/b/c/deep.txt', content: 'deep content' }));
  const content = await fs.readFile(path.join(ws, 'a/b/c/deep.txt'), 'utf-8');
  assert.equal(content, 'deep content');
  await fs.rm(ws, { recursive: true, force: true });
});

test('read_file REJECTS path traversal attempt instead of reading outside workspace', async () => {
  const ws = await makeTempWorkspace();
  // tạo một file "bí mật" NGOÀI workspace để chứng minh nó không bị đọc được
  const secretDir = await makeTempWorkspace();
  await fs.writeFile(path.join(secretDir, 'secret.txt'), 'TOP SECRET');

  const readTool = createReadFileTool(ws);
  const relTraversal = path.relative(ws, path.join(secretDir, 'secret.txt'));
  const result = await readTool.run(relTraversal);

  assert.ok(result.startsWith('Lỗi khi đọc file'));
  assert.ok(!result.includes('TOP SECRET'));

  await fs.rm(ws, { recursive: true, force: true });
  await fs.rm(secretDir, { recursive: true, force: true });
});

test('write_file REJECTS path traversal attempt instead of writing outside workspace', async () => {
  const ws = await makeTempWorkspace();
  const writeTool = createWriteFileTool(ws);
  const result = await writeTool.run(JSON.stringify({ path: '../../etc/hpgk-evil.txt', content: 'pwned' }));
  assert.ok(result.startsWith('Lỗi khi ghi file'));

  // xác nhận file THẬT SỰ không được tạo ra ở bất kỳ đâu ngoài ý muốn
  const wouldBePath = path.resolve(ws, '../../etc/hpgk-evil.txt');
  const exists = await fs.access(wouldBePath).then(() => true).catch(() => false);
  assert.equal(exists, false);

  await fs.rm(ws, { recursive: true, force: true });
});

test('read_file on nonexistent file returns error string, does not throw uncaught', async () => {
  const ws = await makeTempWorkspace();
  const readTool = createReadFileTool(ws);
  const result = await readTool.run('does-not-exist.txt');
  assert.ok(result.startsWith('Lỗi khi đọc file'));
  await fs.rm(ws, { recursive: true, force: true });
});
