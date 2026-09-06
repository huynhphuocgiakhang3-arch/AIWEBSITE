/**
 * core/memory/store.ts
 *
 * Logic THUẦN cho việc chọn memory nào đáng giữ, đáng truy hồi, đáng xoá —
 * tách biệt khỏi nơi lưu trữ thật (JSON file / SQLite / Postgres). Lớp lưu
 * trữ thật nằm ở lib/db.ts trong app, dùng lại các hàm thuần này.
 *
 * Nguyên tắc (mục 14 spec gốc): "Không lưu mọi thứ." — usefulScore thấp
 * và confidence thấp sau một thời gian phải bị prune, không tích luỹ vô hạn.
 */

import type { MemoryRecord, MemoryScope } from './types.ts';

/**
 * Tính điểm hữu ích hiện tại của một memory record, có tính đến độ mới.
 * Công thức: importance và confidence có trọng số ngang nhau, giảm dần
 * theo thời gian (decay) — memory cũ, ít quan trọng sẽ có điểm thấp dần.
 */
export function computeUsefulScore(record: MemoryRecord, now: Date = new Date()): number {
  const ageMs = now.getTime() - new Date(record.updatedAt).getTime();
  const ageDays = Math.max(ageMs / (1000 * 60 * 60 * 24), 0);

  // Half-life 30 ngày: sau 30 ngày không được cập nhật/dùng tới, trọng số còn 50%
  const decay = Math.pow(0.5, ageDays / 30);

  const base = (record.importance * 0.6 + record.confidence * 0.4) / 100;
  return Math.max(0, Math.min(1, base * decay));
}

export interface PruneOptions {
  /** Điểm hữu ích tối thiểu để một record được giữ lại */
  minUsefulScore: number;
  /** Số lượng record tối đa giữ lại cho mỗi scope (tránh phình vô hạn) */
  maxRecordsPerScope: number;
  now?: Date;
}

const DEFAULT_PRUNE_OPTIONS: PruneOptions = {
  minUsefulScore: 0.08,
  maxRecordsPerScope: 200,
};

function scopeKey(scope: MemoryScope): string {
  switch (scope.kind) {
    case 'global':
      return 'global';
    case 'project':
      return `project:${scope.projectId}`;
    case 'conversation':
      return `conversation:${scope.conversationId}`;
  }
}

/**
 * Trả về danh sách record NÊN GIỮ LẠI sau khi áp dụng ngưỡng điểm hữu ích
 * và giới hạn số lượng theo từng scope. Hàm thuần — không tự xoá gì,
 * caller (lớp lưu trữ thật) chịu trách nhiệm áp dụng kết quả này.
 */
export function selectRecordsToKeep(
  records: MemoryRecord[],
  options: Partial<PruneOptions> = {}
): MemoryRecord[] {
  const opts = { ...DEFAULT_PRUNE_OPTIONS, ...options };
  const now = opts.now ?? new Date();

  const scored = records
    .map((r) => ({ record: r, score: computeUsefulScore(r, now) }))
    .filter((s) => s.score >= opts.minUsefulScore);

  const byScope = new Map<string, typeof scored>();
  for (const item of scored) {
    const key = scopeKey(item.record.scope);
    const list = byScope.get(key) ?? [];
    list.push(item);
    byScope.set(key, list);
  }

  const kept: MemoryRecord[] = [];
  for (const list of byScope.values()) {
    list.sort((a, b) => b.score - a.score);
    kept.push(...list.slice(0, opts.maxRecordsPerScope).map((s) => s.record));
  }

  return kept;
}

/**
 * Phát hiện record trùng lặp gần giống nhau trong cùng scope (dedupe đơn
 * giản dựa trên nội dung chuẩn hoá) — tránh lưu cùng một sự thật nhiều lần
 * dưới cách diễn đạt khác nhau một chút.
 */
export function findDuplicates(records: MemoryRecord[]): Array<[MemoryRecord, MemoryRecord]> {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  const duplicates: Array<[MemoryRecord, MemoryRecord]> = [];

  for (let i = 0; i < records.length; i++) {
    const a = records[i];
    // Về logic không bao giờ undefined vì i < records.length, nhưng
    // noUncheckedIndexedAccess coi records[i] là MemoryRecord | undefined —
    // guard này thu hẹp kiểu một cách trung thực, không dùng "!" ép kiểu.
    if (!a) continue;
    for (let j = i + 1; j < records.length; j++) {
      const b = records[j];
      if (!b) continue;
      if (scopeKey(a.scope) !== scopeKey(b.scope)) continue;
      if (a.type !== b.type) continue;
      if (normalize(a.content) === normalize(b.content)) {
        duplicates.push([a, b]);
      }
    }
  }
  return duplicates;
}

/** Truy hồi memory theo scope + type, sắp xếp theo điểm hữu ích giảm dần. */
export function queryMemory(
  records: MemoryRecord[],
  filter: { scope?: MemoryScope; type?: MemoryRecord['type'] },
  now: Date = new Date()
): MemoryRecord[] {
  return records
    .filter((r) => (filter.type ? r.type === filter.type : true))
    .filter((r) => (filter.scope ? scopeKey(r.scope) === scopeKey(filter.scope) : true))
    .sort((a, b) => computeUsefulScore(b, now) - computeUsefulScore(a, now));
}
