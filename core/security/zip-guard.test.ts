import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateZipEntry,
  validateZipArchive,
  DEFAULT_ZIP_GUARD_CONFIG,
  type ZipEntryMeta,
} from './zip-guard.ts';

const TARGET_DIR = '/tmp/hpgk-extract-test';

function entry(overrides: Partial<ZipEntryMeta>): ZipEntryMeta {
  return {
    name: 'file.txt',
    uncompressedSize: 100,
    compressedSize: 50,
    ...overrides,
  };
}

test('validateZipEntry: accepts a normal nested file', () => {
  const result = validateZipEntry(entry({ name: 'src/components/Button.tsx' }), TARGET_DIR);
  assert.equal(result.ok, true);
  assert.ok(result.safeDestPath?.startsWith(TARGET_DIR));
});

test('validateZipEntry: REJECTS classic zip slip payload "../../etc/passwd"', () => {
  const result = validateZipEntry(entry({ name: '../../etc/passwd' }), TARGET_DIR);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'suspicious_filename');
});

test('validateZipEntry: REJECTS deeply nested traversal "a/b/../../../etc/cron.d/evil"', () => {
  const result = validateZipEntry(entry({ name: 'a/b/../../../etc/cron.d/evil' }), TARGET_DIR);
  assert.equal(result.ok, false);
  // Bị chặn ở bước suspicious_filename (chứa "..") trước khi cần resolve
  assert.equal(result.reason, 'suspicious_filename');
});

test('validateZipEntry: REJECTS absolute path entry', () => {
  const result = validateZipEntry(entry({ name: '/etc/passwd' }), TARGET_DIR);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'absolute_path');
});

test('validateZipEntry: REJECTS Windows-style absolute path', () => {
  const result = validateZipEntry(entry({ name: 'C:\\Windows\\System32\\evil.dll' }), TARGET_DIR);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'suspicious_filename');
});

test('validateZipEntry: REJECTS symlink entries unconditionally', () => {
  const result = validateZipEntry(entry({ name: 'link.txt', isSymlink: true }), TARGET_DIR);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'symlink_not_allowed');
});

test('validateZipEntry: REJECTS entry exceeding max size', () => {
  const result = validateZipEntry(
    entry({ name: 'huge.bin', uncompressedSize: DEFAULT_ZIP_GUARD_CONFIG.maxUncompressedEntrySize + 1 }),
    TARGET_DIR
  );
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'entry_too_large');
});

test('validateZipEntry: REJECTS suspicious compression ratio (zip bomb signal)', () => {
  // Kịch bản zip bomb thực tế: entry NHỎ (không chạm ngưỡng entry_too_large)
  // nhưng nén ra tỉ lệ bất thường (ví dụ 10MB giải nén từ 10KB nén = 1000x).
  const result = validateZipEntry(
    entry({ name: 'bomb.bin', uncompressedSize: 10 * 1024 * 1024, compressedSize: 10 * 1024 }),
    TARGET_DIR
  );
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'suspicious_compression_ratio');
});

test('validateZipEntry: enforces extension whitelist when configured', () => {
  const config = { ...DEFAULT_ZIP_GUARD_CONFIG, allowedExtensions: ['.ts', '.tsx', '.json'] };
  const rejected = validateZipEntry(entry({ name: 'script.exe' }), TARGET_DIR, config);
  const accepted = validateZipEntry(entry({ name: 'component.tsx' }), TARGET_DIR, config);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.reason, 'disallowed_extension');
  assert.equal(accepted.ok, true);
});

test('validateZipArchive: whole-archive rejected if ANY entry is malicious (fail-closed policy)', () => {
  const entries = [
    entry({ name: 'src/index.ts' }),
    entry({ name: 'README.md' }),
    entry({ name: '../../etc/passwd' }), // 1 quả táo hỏng
  ];
  const result = validateZipArchive(entries, TARGET_DIR);
  assert.equal(result.ok, false);
  assert.equal(result.rejectedEntries.length, 1);
  assert.equal(result.acceptedEntries.length, 2);
});

test('validateZipArchive: accepts a fully clean archive', () => {
  const entries = [
    entry({ name: 'package.json' }),
    entry({ name: 'src/index.ts' }),
    entry({ name: 'src/utils/helpers.ts' }),
  ];
  const result = validateZipArchive(entries, TARGET_DIR);
  assert.equal(result.ok, true);
  assert.equal(result.acceptedEntries.length, 3);
  assert.equal(result.rejectedEntries.length, 0);
});

test('validateZipArchive: rejects archive exceeding max entry count', () => {
  const entries = Array.from({ length: 6000 }, (_, i) => entry({ name: `file${i}.txt` }));
  const result = validateZipArchive(entries, TARGET_DIR);
  assert.equal(result.ok, false);
  assert.equal(result.rejectedEntries[0].result.reason, 'too_many_entries');
});

test('validateZipArchive: rejects archive exceeding total uncompressed size even if each entry is individually fine', () => {
  const bigButIndividuallyOk = 40 * 1024 * 1024; // 40MB each, under 50MB per-entry cap
  const entries = Array.from({ length: 20 }, (_, i) =>
    entry({ name: `part${i}.bin`, uncompressedSize: bigButIndividuallyOk, compressedSize: 20 * 1024 * 1024 })
  ); // 20 * 40MB = 800MB > 500MB total cap
  const result = validateZipArchive(entries, TARGET_DIR);
  assert.equal(result.ok, false);
  assert.ok(result.rejectedEntries.some((r) => r.result.reason === 'total_size_exceeded'));
});
