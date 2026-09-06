'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProjectRecord } from '../../lib/project-types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data.projects ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    if (!name.trim()) return;
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setName('');
    refresh();
  }

  return (
    <div className="main-scroll">
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 16px' }}>Dự án</h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên project mới…"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-s)',
              border: '1px solid var(--hpgk-border)',
              background: 'var(--hpgk-surface-elevated)',
              color: 'var(--hpgk-text)',
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-s)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--hpgk-primary), var(--hpgk-accent))',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Tạo dự án
          </button>
        </div>

        {loading && <p style={{ color: 'var(--hpgk-muted)' }}>Đang tải…</p>}
        {!loading && projects.length === 0 && (
          <p style={{ color: 'var(--hpgk-muted)' }}>Chưa có dự án nào. Tạo dự án đầu tiên ở trên.</p>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              style={{
                display: 'block',
                background: 'var(--hpgk-surface-elevated)',
                border: '1px solid var(--hpgk-border)',
                borderRadius: 'var(--radius-m)',
                padding: 14,
                color: 'var(--hpgk-text)',
                textDecoration: 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{p.name}</strong>
                <span style={{ color: 'var(--hpgk-muted-2)', fontSize: '0.8rem' }}>{p.fileCount} file</span>
              </div>
              <p style={{ color: 'var(--hpgk-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                {p.detectedStack.length > 0 ? p.detectedStack.map((s) => s.name).join(', ') : 'Chưa upload file nào'}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
