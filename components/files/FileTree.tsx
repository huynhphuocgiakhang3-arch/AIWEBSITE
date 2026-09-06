'use client';

export function FileTree({ files, selected, onSelect }: { files: string[]; selected: string | null; onSelect: (path: string) => void }) {
  if (files.length === 0) {
    return <p style={{ color: 'var(--hpgk-muted)', fontSize: '0.85rem' }}>Chưa có file nào trong project này.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 500, overflowY: 'auto' }}>
      {files.map((file) => (
        <button
          key={file}
          onClick={() => onSelect(file)}
          style={{
            textAlign: 'left',
            padding: '5px 8px',
            borderRadius: 6,
            border: 'none',
            background: selected === file ? 'rgba(91,124,250,0.16)' : 'none',
            color: selected === file ? '#fff' : 'var(--hpgk-muted)',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {file}
        </button>
      ))}
    </div>
  );
}
