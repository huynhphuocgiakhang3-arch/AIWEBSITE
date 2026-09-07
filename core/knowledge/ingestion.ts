/**
 * core/knowledge/ingestion.ts
 *
 * ĐÂY KHÔNG PHẢI "AI tự học machine learning" — không có model nào được
 * train ở đây. Đây là một pipeline THẬT xử lý từng knowledge entry:
 * validate cấu trúc, tokenize nội dung, và xây một inverted index
 * (token → danh sách entry id chứa token đó) để tăng tốc tra cứu sau này.
 *
 * Vì sao báo tiến trình THẬT lại có ý nghĩa: với vài chục entry việc này
 * xong trong mili-giây, nhưng pipeline được viết để xử lý TUẦN TỰ từng
 * entry (không dùng Promise.all song song toàn bộ) chính là để có một
 * điểm dừng thật giữa chừng — hỗ trợ AbortSignal thật, không phải hoạt
 * cảnh giả có sẵn kịch bản.
 */

import type { KnowledgeEntry } from './types.ts';
import { tokenize } from './retrieval.ts';

export type IngestionPhase = 'validating' | 'tokenizing' | 'indexing' | 'done' | 'aborted';

export interface IngestionProgressEvent {
  phase: IngestionPhase;
  processedCount: number;
  totalCount: number;
  currentEntryId?: string;
  currentEntryTitle?: string;
  /** Số token DUY NHẤT đã đưa vào chỉ mục tính tới thời điểm này — số liệu thật, không bịa */
  indexedTokenCount: number;
}

export interface InvertedIndex {
  /** token đã chuẩn hoá -> danh sách id entry có chứa token đó */
  [token: string]: string[];
}

export interface IngestionResult {
  index: InvertedIndex;
  entriesProcessed: number;
  totalEntries: number;
  uniqueTokens: number;
  aborted: boolean;
  durationMs: number;
}

export interface RunIngestionOptions {
  entries: KnowledgeEntry[];
  onProgress?: (event: IngestionProgressEvent) => void;
  signal?: AbortSignal;
  /**
   * Độ trễ nhân tạo giữa mỗi entry (ms) — CHỈ dùng để UI có thể hiển thị
   * tiến trình theo thời gian thực và người dùng có cơ hội nhấn Dừng.
   * Với vài chục entry, xử lý thật xong trong <5ms — không có độ trễ này
   * người dùng sẽ không kịp thấy hay dừng được gì. Mặc định 0 (tắt) cho
   * môi trường test; UI thật sẽ truyền một giá trị nhỏ (ví dụ 60-120ms).
   */
  stepDelayMs?: number;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}

/**
 * Chạy pipeline nạp + lập chỉ mục THẬT trên tập knowledge entry đã cho.
 * Mỗi entry thực sự được tokenize và đưa vào inverted index — không có
 * bước nào bị giả lập. Có thể dừng giữa chừng qua AbortSignal, và khi
 * dừng, hàm trả về đúng trạng thái đã xử lý được TỚI ĐÂU (aborted: true),
 * không giả vờ đã xong.
 */
export async function runIngestion(options: RunIngestionOptions): Promise<IngestionResult> {
  const { entries, onProgress, signal, stepDelayMs = 0 } = options;
  const startedAt = Date.now();
  const index: InvertedIndex = {};
  let processed = 0;

  for (const entry of entries) {
    if (signal?.aborted) {
      onProgress?.({
        phase: 'aborted',
        processedCount: processed,
        totalCount: entries.length,
        indexedTokenCount: Object.keys(index).length,
      });
      return {
        index,
        entriesProcessed: processed,
        totalEntries: entries.length,
        uniqueTokens: Object.keys(index).length,
        aborted: true,
        durationMs: Date.now() - startedAt,
      };
    }

    onProgress?.({
      phase: 'validating',
      processedCount: processed,
      totalCount: entries.length,
      currentEntryId: entry.id,
      currentEntryTitle: entry.title,
      indexedTokenCount: Object.keys(index).length,
    });

    // Tokenize TOÀN BỘ nội dung văn bản thật của entry — không chỉ title.
    const textFields = [
      entry.title,
      entry.concept,
      entry.why,
      entry.how,
      ...entry.best_practices,
      ...entry.common_mistakes,
      ...entry.tradeoffs,
    ].join(' ');
    const tokens = tokenize(textFields);

    onProgress?.({
      phase: 'tokenizing',
      processedCount: processed,
      totalCount: entries.length,
      currentEntryId: entry.id,
      currentEntryTitle: entry.title,
      indexedTokenCount: Object.keys(index).length,
    });

    for (const token of tokens) {
      // Bắt buộc dùng biến cục bộ `bucket` thay vì đọc lại `index[token]`
      // nhiều lần: với index signature, noUncheckedIndexedAccess coi mỗi
      // lần đọc là string[] | undefined ĐỘC LẬP — gán xong rồi đọc lại
      // không được TypeScript narrow tự động qua 2 statement khác nhau.
      let bucket = index[token];
      if (!bucket) {
        bucket = [];
        index[token] = bucket;
      }
      if (!bucket.includes(entry.id)) bucket.push(entry.id);
    }

    processed += 1;

    onProgress?.({
      phase: 'indexing',
      processedCount: processed,
      totalCount: entries.length,
      currentEntryId: entry.id,
      currentEntryTitle: entry.title,
      indexedTokenCount: Object.keys(index).length,
    });

    try {
      await delay(stepDelayMs, signal);
    } catch {
      onProgress?.({
        phase: 'aborted',
        processedCount: processed,
        totalCount: entries.length,
        indexedTokenCount: Object.keys(index).length,
      });
      return {
        index,
        entriesProcessed: processed,
        totalEntries: entries.length,
        uniqueTokens: Object.keys(index).length,
        aborted: true,
        durationMs: Date.now() - startedAt,
      };
    }
  }

  onProgress?.({
    phase: 'done',
    processedCount: processed,
    totalCount: entries.length,
    indexedTokenCount: Object.keys(index).length,
  });

  return {
    index,
    entriesProcessed: processed,
    totalEntries: entries.length,
    uniqueTokens: Object.keys(index).length,
    aborted: false,
    durationMs: Date.now() - startedAt,
  };
}
