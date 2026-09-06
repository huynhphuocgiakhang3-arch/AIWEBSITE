'use client';

export function CodeViewer({ path, content }: { path: string | null; content: string | null }) {
  if (!path) {
    return <p style={{ color: 'var(--hpgk-muted)', fontSize: '0.85rem' }}>Chọn một file bên trái để xem nội dung.</p>;
  }
  return (
    <div>
      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--hpgk-muted)', marginBottom: 8 }}>{path}</div>
      <pre
        style={{
          background: 'var(--hpgk-bg)',
          border: '1px solid var(--hpgk-border)',
          borderRadius: 'var(--radius-m)',
          padding: 14,
          overflow: 'auto',
          maxHeight: 520,
          fontSize: '0.8rem',
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        <code>{content ?? 'Đang tải…'}</code>
      </pre>
    </div>
  );
}
