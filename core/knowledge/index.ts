/**
 * core/knowledge/index.ts
 *
 * Nạp toàn bộ knowledge entries từ core/knowledge/data/*.json và validate
 * cấu trúc cơ bản (đúng schema KnowledgeEntry, id không trùng lặp).
 * Đây là điểm vào duy nhất mà phần còn lại của ứng dụng nên dùng để lấy
 * knowledge base — không import trực tiếp từng file JSON rải rác.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { KnowledgeEntry } from './types.ts';

// Dùng import.meta.url + fileURLToPath thay vì import.meta.dirname —
// import.meta.dirname là API Node.js khá mới (20.11+/21.2+), và không có
// cách nào xác nhận trong sandbox này (không có mạng) rằng phiên bản
// @types/node sẽ cài thật sự khai báo type cho nó. fileURLToPath +
// path.dirname là pattern ESM chuẩn, tương thích mọi version TypeScript/
// Node.js gần đây — không đánh cược vào một API còn mới.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REQUIRED_STRING_FIELDS: Array<keyof KnowledgeEntry> = ['id', 'domain', 'title', 'concept', 'why', 'how'];
const REQUIRED_ARRAY_FIELDS: Array<keyof KnowledgeEntry> = [
  'when_to_use',
  'when_not_to_use',
  'best_practices',
  'common_mistakes',
  'related',
];

export interface KnowledgeValidationIssue {
  file: string;
  entryId?: string;
  problem: string;
}

export interface LoadKnowledgeResult {
  entries: KnowledgeEntry[];
  issues: KnowledgeValidationIssue[];
}

function validateEntry(entry: Partial<KnowledgeEntry>, file: string): KnowledgeValidationIssue[] {
  const issues: KnowledgeValidationIssue[] = [];
  for (const field of REQUIRED_STRING_FIELDS) {
    const value = entry[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      issues.push({ file, entryId: entry.id, problem: `Thiếu hoặc rỗng field bắt buộc "${String(field)}"` });
    }
  }
  for (const field of REQUIRED_ARRAY_FIELDS) {
    if (!Array.isArray(entry[field])) {
      issues.push({ file, entryId: entry.id, problem: `Field "${String(field)}" phải là array` });
    }
  }
  if (typeof entry.confidence !== 'number' || entry.confidence < 0 || entry.confidence > 100) {
    issues.push({ file, entryId: entry.id, problem: 'confidence phải là số trong khoảng 0-100' });
  }
  return issues;
}

/**
 * Đọc toàn bộ file .json trong thư mục data/, validate, và trả về danh sách
 * entry hợp lệ kèm danh sách vấn đề THẬT phát hiện được (không che giấu lỗi dữ liệu).
 */
export async function loadKnowledgeBase(dataDir: string = path.join(__dirname, 'data')): Promise<LoadKnowledgeResult> {
  const issues: KnowledgeValidationIssue[] = [];
  const entries: KnowledgeEntry[] = [];
  const seenIds = new Set<string>();

  let files: string[];
  try {
    files = (await fs.readdir(dataDir)).filter((f) => f.endsWith('.json'));
  } catch (err) {
    return { entries: [], issues: [{ file: dataDir, problem: `Không đọc được thư mục: ${err instanceof Error ? err.message : String(err)}` }] };
  }

  for (const file of files) {
    const fullPath = path.join(dataDir, file);
    let raw: unknown;
    try {
      raw = JSON.parse(await fs.readFile(fullPath, 'utf-8'));
    } catch (err) {
      issues.push({ file, problem: `JSON không hợp lệ: ${err instanceof Error ? err.message : String(err)}` });
      continue;
    }

    if (!Array.isArray(raw)) {
      issues.push({ file, problem: 'Nội dung file phải là một JSON array các knowledge entry' });
      continue;
    }

    for (const item of raw as Array<Partial<KnowledgeEntry>>) {
      const entryIssues = validateEntry(item, file);
      if (entryIssues.length > 0) {
        issues.push(...entryIssues);
        continue; // KHÔNG nạp entry không hợp lệ, dù có thể thiếu vài field nhỏ
      }
      if (seenIds.has(item.id as string)) {
        issues.push({ file, entryId: item.id, problem: `id trùng lặp với entry đã nạp trước đó` });
        continue;
      }
      seenIds.add(item.id as string);
      entries.push(item as KnowledgeEntry);
    }
  }

  return { entries, issues };
}
