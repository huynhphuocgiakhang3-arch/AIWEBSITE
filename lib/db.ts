/**
 * lib/db.ts
 *
 * Lớp lưu trữ v1: JSON file trên đĩa, KHÔNG phải giả lập. Đây là lựa chọn
 * có chủ đích cho v1 để toàn bộ hệ thống chạy được ngay mà không cần cài
 * đặt Postgres/Prisma (vốn cần `npm install` + network, không khả dụng
 * trong môi trường build này). Đường nâng cấp lên Prisma + PostgreSQL được
 * mô tả trong docs/architecture.md — interface bên dưới được thiết kế để
 * có thể thay thế bằng adapter Prisma sau này mà không đổi call site.
 *
 * Mỗi "bảng" là một file JSON độc lập, đọc/ghi an toàn cho single-process
 * (phù hợp self-host / VPS đơn instance). KHÔNG an toàn cho multi-instance
 * ghi đồng thời — đó là lý do tài liệu ghi rõ đây là v1, không phải giải
 * pháp production đa instance.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export interface JsonTable<T extends { id: string }> {
  all: () => Promise<T[]>;
  get: (id: string) => Promise<T | undefined>;
  insert: (record: T) => Promise<T>;
  update: (id: string, patch: Partial<T>) => Promise<T | undefined>;
  remove: (id: string) => Promise<boolean>;
  /** Ghi đè toàn bộ bảng — dùng cho các thao tác hàng loạt như prune memory */
  replaceAll: (records: T[]) => Promise<void>;
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

async function writeJsonArray<T>(filePath: string, records: T[]): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  // Ghi ra file tạm rồi rename — giảm rủi ro file bị hỏng nếu tiến trình
  // bị ngắt giữa chừng lúc đang ghi (atomic-ish write cho single-process).
  const tmpPath = `${filePath}.tmp-${process.pid}`;
  await fs.writeFile(tmpPath, JSON.stringify(records, null, 2), 'utf-8');
  await fs.rename(tmpPath, filePath);
}

/**
 * Tạo một "bảng" JSON đơn giản tại dataDir/<name>.json.
 * Đơn giản, không có transaction thật — chấp nhận được cho v1 single-user/
 * single-instance self-host, KHÔNG khuyến nghị cho nhiều instance ghi đồng thời.
 */
export function createJsonTable<T extends { id: string }>(dataDir: string, name: string): JsonTable<T> {
  const filePath = path.join(dataDir, `${name}.json`);

  return {
    all: () => readJsonArray<T>(filePath),

    get: async (id) => {
      const records = await readJsonArray<T>(filePath);
      return records.find((r) => r.id === id);
    },

    insert: async (record) => {
      const records = await readJsonArray<T>(filePath);
      if (records.some((r) => r.id === record.id)) {
        throw new Error(`Bản ghi với id "${record.id}" đã tồn tại trong bảng "${name}"`);
      }
      records.push(record);
      await writeJsonArray(filePath, records);
      return record;
    },

    update: async (id, patch) => {
      const records = await readJsonArray<T>(filePath);
      const idx = records.findIndex((r) => r.id === id);
      if (idx === -1) return undefined;
      records[idx] = { ...records[idx], ...patch };
      await writeJsonArray(filePath, records);
      return records[idx];
    },

    remove: async (id) => {
      const records = await readJsonArray<T>(filePath);
      const next = records.filter((r) => r.id !== id);
      const removed = next.length !== records.length;
      if (removed) await writeJsonArray(filePath, next);
      return removed;
    },

    replaceAll: async (records) => {
      await writeJsonArray(filePath, records);
    },
  };
}
