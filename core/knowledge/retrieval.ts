/**
 * core/knowledge/retrieval.ts
 *
 * Knowledge retrieval engine — hoạt động OFFLINE-FIRST (mục 41 trong spec gốc):
 * không phụ thuộc vào API AI hay embedding model để tra cứu. Đây là retrieval
 * bằng keyword matching + metadata filtering + confidence ranking, thuần
 * TypeScript, KHÔNG import bất kỳ package ngoài nào — có thể chạy và test
 * ngay bằng `node --experimental-strip-types` mà không cần npm install.
 *
 * Nếu môi trường triển khai sau này có embedding model, đây là lớp có thể
 * mở rộng thêm semantic retrieval — nhưng fallback này PHẢI luôn hoạt động
 * độc lập, theo đúng yêu cầu "Knowledge ≠ Model" (mục 40 spec gốc).
 */

import type { KnowledgeDomain, KnowledgeEntry } from './types.ts';

export interface RetrievalQuery {
  text: string;
  domain?: KnowledgeDomain;
  /** Số kết quả tối đa trả về */
  limit?: number;
  /** Ngưỡng điểm tối thiểu để được xem là "liên quan" (0-1) */
  minScore?: number;
}

export interface RetrievalResult {
  entry: KnowledgeEntry;
  /** Điểm liên quan 0-1, tính từ keyword overlap — KHÔNG phải "độ chính xác AI" */
  score: number;
  matchedFields: string[];
}

const STOPWORDS_VI_EN = new Set([
  'la', 'va', 'la gi', 'the', 'a', 'an', 'is', 'are', 'of', 'in', 'on',
  'cua', 'va', 'la', 'nao', 'gi', 'khi', 'to', 'for', 'with',
]);

/** Chuẩn hoá text: hạ chữ thường, bỏ dấu câu, tách từ. Không phụ thuộc thư viện NLP. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS_VI_EN.has(t));
}

const FIELD_WEIGHTS: Record<string, number> = {
  title: 3,
  concept: 2,
  why: 1.4,
  how: 1.4,
  best_practices: 1,
  common_mistakes: 1,
  patterns: 0.8,
  anti_patterns: 0.8,
  tradeoffs: 0.6,
};

function fieldText(entry: KnowledgeEntry, field: string): string {
  const value = (entry as unknown as Record<string, unknown>)[field];
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string').join(' ');
  return '';
}

/**
 * Tính điểm liên quan giữa một entry và các token truy vấn.
 * Thuật toán: với mỗi field có trọng số, đếm tỉ lệ token truy vấn xuất hiện
 * trong field đó, nhân với trọng số field, cộng dồn, rồi chuẩn hoá về [0,1].
 */
export function scoreEntry(entry: KnowledgeEntry, queryTokens: string[]): { score: number; matchedFields: string[] } {
  if (queryTokens.length === 0) return { score: 0, matchedFields: [] };

  let raw = 0;
  let maxPossible = 0;
  const matchedFields: string[] = [];

  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    maxPossible += weight;
    const fieldTokens = new Set(tokenize(fieldText(entry, field)));
    if (fieldTokens.size === 0) continue;

    let hits = 0;
    for (const qt of queryTokens) {
      if (fieldTokens.has(qt)) hits += 1;
    }
    if (hits > 0) {
      const fieldScore = (hits / queryTokens.length) * weight;
      raw += fieldScore;
      matchedFields.push(field);
    }
  }

  const score = maxPossible > 0 ? Math.min(raw / maxPossible, 1) : 0;
  return { score, matchedFields };
}

/**
 * Truy hồi knowledge entries liên quan nhất tới một câu hỏi.
 * Đây là hàm THUẦN (pure function): cùng input luôn cho cùng output,
 * không có side effect, không gọi network — dễ test và dễ kiểm chứng.
 */
export function retrieve(entries: KnowledgeEntry[], query: RetrievalQuery): RetrievalResult[] {
  const limit = query.limit ?? 5;
  const minScore = query.minScore ?? 0.05;
  const queryTokens = tokenize(query.text);

  const candidates = query.domain
    ? entries.filter((e) => e.domain === query.domain)
    : entries;

  const scored: RetrievalResult[] = candidates
    .map((entry) => {
      const { score, matchedFields } = scoreEntry(entry, queryTokens);
      return { entry, score, matchedFields };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // hoà điểm: ưu tiên confidence do người biên soạn gán cao hơn
      return b.entry.confidence - a.entry.confidence;
    });

  return scored.slice(0, limit);
}

/** Lấy toàn bộ entry liên quan trực tiếp (related) tới một entry cho trước. */
export function getRelated(entries: KnowledgeEntry[], entryId: string): KnowledgeEntry[] {
  const source = entries.find((e) => e.id === entryId);
  if (!source) return [];
  const relatedIds = new Set(source.related);
  return entries.filter((e) => relatedIds.has(e.id));
}

/** Thống kê thật (không bịa số) về knowledge base hiện có — dùng cho UI dashboard. */
export function getKnowledgeStats(entries: KnowledgeEntry[]) {
  const byDomain: Record<string, number> = {};
  for (const e of entries) {
    byDomain[e.domain] = (byDomain[e.domain] ?? 0) + 1;
  }
  return {
    totalEntries: entries.length,
    domains: Object.keys(byDomain).length,
    byDomain,
  };
}
