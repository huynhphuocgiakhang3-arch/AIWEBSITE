'use client';

import { useRef, useState } from 'react';
import type { IngestionProgressEvent, IngestionResult } from '../../core/knowledge/ingestion';

type StreamMessage =
  | { type: 'progress'; event: IngestionProgressEvent }
  | { type: 'result'; result: IngestionResult }
  | { type: 'error'; message: string };

const PHASE_LABEL: Record<IngestionProgressEvent['phase'], string> = {
  validating: 'Đang kiểm tra cấu trúc',
  tokenizing: 'Đang tách từ khoá',
  indexing: 'Đã lập chỉ mục',
  done: 'Hoàn tất',
  aborted: 'Đã dừng',
};

export function IngestionPanel() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  function appendLog(line: string) {
    setLog((prev) => {
      const next = [...prev, line];
      // Giữ tối đa 200 dòng gần nhất để tránh phình DOM vô hạn với knowledge base lớn dần theo thời gian
      return next.length > 200 ? next.slice(next.length - 200) : next;
    });
  }

  async function handleStart() {
    setRunning(true);
    setLog([]);
    setResult(null);
    setErrorMsg(null);
    setProgress(null);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch('/api/knowledge/ingest', { method: 'POST', signal: controller.signal });
      if (!res.body) throw new Error('Server không trả về stream (res.body rỗng).');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (!line.trim()) continue;

          const message = JSON.parse(line) as StreamMessage;

          if (message.type === 'progress') {
            const e = message.event;
            setProgress({ processed: e.processedCount, total: e.totalCount });
            if (e.currentEntryTitle) {
              appendLog(`[${PHASE_LABEL[e.phase]}] ${e.currentEntryId} — ${e.currentEntryTitle}`);
            } else if (e.phase === 'done' || e.phase === 'aborted') {
              appendLog(`— ${PHASE_LABEL[e.phase]} —`);
            }
          } else if (message.type === 'result') {
            setResult(message.result);
          } else if (message.type === 'error') {
            setErrorMsg(message.message);
          }
        }
      }
    } catch (err) {
      // AbortError xảy ra khi CHÍNH người dùng bấm Dừng — không phải lỗi thật, không hiển thị như lỗi
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      if (!isAbort) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setRunning(false);
      controllerRef.current = null;
    }
  }

  function handleStop() {
    controllerRef.current?.abort();
  }

  const percent = progress && progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div
      style={{
        border: '1px solid var(--hpgk-border)',
        borderRadius: 'var(--radius-m)',
        background: 'var(--hpgk-surface-elevated)',
        padding: 18,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h2 style={{ fontSize: '0.95rem', margin: 0 }}>Nạp &amp; Lập chỉ mục Tri thức</h2>
        {!running ? (
          <button onClick={handleStart} style={primaryButtonStyle}>
            Bắt đầu
          </button>
        ) : (
          <button onClick={handleStop} style={stopButtonStyle}>
            ■ Dừng
          </button>
        )}
      </div>
      <p style={{ color: 'var(--hpgk-muted)', fontSize: '0.8rem', marginTop: 0, marginBottom: 14 }}>
        Xử lý và lập chỉ mục thật từng mục tri thức đang có trong hệ thống — không phải huấn luyện AI.
        Không cần API key.
      </p>

      {progress && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ height: 6, background: 'var(--hpgk-bg)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${percent}%`,
                background: 'linear-gradient(90deg, var(--hpgk-primary), var(--hpgk-accent))',
                transition: 'width 120ms ease-out',
              }}
            />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--hpgk-muted)', margin: '6px 0 0' }}>
            {progress.processed} / {progress.total} mục — {percent}%
          </p>
        </div>
      )}

      {log.length > 0 && (
        <div
          style={{
            background: 'var(--hpgk-bg)',
            border: '1px solid var(--hpgk-border)',
            borderRadius: 'var(--radius-s)',
            padding: 10,
            maxHeight: 220,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.74rem',
            lineHeight: 1.6,
            color: 'var(--hpgk-muted)',
          }}
        >
          {log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {errorMsg && (
        <p style={{ color: 'var(--hpgk-error)', fontSize: '0.82rem', marginTop: 10 }}>Lỗi: {errorMsg}</p>
      )}

      {result && (
        <div style={{ marginTop: 12, fontSize: '0.84rem' }}>
          <p style={{ margin: '4px 0' }}>
            {result.aborted ? '⏹ Đã dừng theo yêu cầu' : '✓ Hoàn tất'} — xử lý {result.entriesProcessed}/
            {result.totalEntries} mục, lập chỉ mục {result.uniqueTokens} từ khoá duy nhất, mất{' '}
            {result.durationMs}ms.
          </p>
        </div>
      )}
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  padding: '7px 16px',
  borderRadius: 'var(--radius-s)',
  border: 'none',
  background: 'linear-gradient(135deg, var(--hpgk-primary), var(--hpgk-accent))',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.82rem',
};

const stopButtonStyle: React.CSSProperties = {
  padding: '7px 16px',
  borderRadius: 'var(--radius-s)',
  border: '1px solid var(--hpgk-error)',
  background: 'none',
  color: 'var(--hpgk-error)',
  cursor: 'pointer',
  fontSize: '0.82rem',
};
