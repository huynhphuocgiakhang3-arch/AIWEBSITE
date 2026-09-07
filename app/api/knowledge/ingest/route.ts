import { NextRequest, NextResponse } from 'next/server';
import { loadKnowledgeBase } from '../../../../core/knowledge/index';
import { runIngestion } from '../../../../core/knowledge/ingestion';
import type { IngestionProgressEvent, IngestionResult } from '../../../../core/knowledge/ingestion';

// Bắt buộc: route này stream dữ liệu theo thời gian thực, không được để
// Next.js tối ưu tĩnh hoá hay cache response.
export const dynamic = 'force-dynamic';

type StreamMessage =
  | { type: 'progress'; event: IngestionProgressEvent }
  | { type: 'result'; result: IngestionResult }
  | { type: 'error'; message: string };

/**
 * KHÔNG phải endpoint "train AI" — đây là endpoint chạy pipeline nạp +
 * lập chỉ mục THẬT trên Knowledge Core (xem core/knowledge/ingestion.ts).
 * Tiến trình được stream về client theo từng dòng JSON (NDJSON) ngay khi
 * xử lý xong mỗi entry — không có bước nào giả lập hay có kịch bản dựng sẵn.
 *
 * Dừng thật: khi client gọi controller.abort() trên AbortController phía
 * client (đang fetch() request này), kết nối HTTP bị ngắt, req.signal ở
 * đây nhận được sự kiện abort, và runIngestion() dừng NGAY tại entry đang
 * xử lý — không xử lý tiếp các entry còn lại.
 */
export async function POST(req: NextRequest) {
  const { entries, issues } = await loadKnowledgeBase();

  if (issues.length > 0) {
    // Vẫn tiếp tục với các entry hợp lệ, nhưng báo trung thực có vấn đề
    // dữ liệu thay vì âm thầm bỏ qua.
    console.warn(`[ingest] ${issues.length} vấn đề validation khi nạp knowledge base:`, issues);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(message: StreamMessage) {
        controller.enqueue(encoder.encode(JSON.stringify(message) + '\n'));
      }

      try {
        const result = await runIngestion({
          entries,
          signal: req.signal,
          // Độ trễ nhỏ giữa mỗi entry để người dùng thực sự thấy tiến
          // trình chạy theo thời gian thực và có cơ hội bấm Dừng — không
          // phải để giả vờ "đang suy nghĩ", mà vì xử lý 32 entry thật
          // xong trong vài mili-giây sẽ không kịp hiển thị gì cả.
          stepDelayMs: 90,
          onProgress: (event) => send({ type: 'progress', event }),
        });
        send({ type: 'result', result });
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
