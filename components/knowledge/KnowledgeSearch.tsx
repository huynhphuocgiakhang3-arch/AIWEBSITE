'use client';

import { useState } from 'react';
import type { KnowledgeEntry } from '../../core/knowledge/types';

interface SearchResult {
  entry: KnowledgeEntry;
  score: number;
  matchedFields: string[];
}

interface KnowledgeStats {
  totalEntries: number;
  domains: number;
  byDomain: Record<string, number>;
}

export function KnowledgeSearch({ initialStats }: { initialStats: KnowledgeStats }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<KnowledgeEntry | null>(null);

  async function handleSearch(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard label="Tổng số mục" value={stats.totalEntries} />
        <StatCard label="Số domain" value={stats.domains} />
      </div>

      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Tìm kiếm trong Knowledge Core… (ví dụ: N+1 query, zip slip, rate limiting)"
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 'var(--radius-m)',
          border: '1px solid var(--hpgk-border)',
          background: 'var(--hpgk-surface-elevated)',
          color: 'var(--hpgk-text)',
          fontSize: '0.92rem',
          marginBottom: 18,
        }}
      />

      {loading && <p style={{ color: 'var(--hpgk-muted)' }}>Đang tìm…</p>}

      {!loading && query.trim() && results.length === 0 && (
        <p style={{ color: 'var(--hpgk-muted)' }}>Không tìm thấy mục tri thức nào liên quan tới &ldquo;{query}&rdquo;.</p>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {results.map((r) => (
          <button
            key={r.entry.id}
            onClick={() => setSelected(r.entry)}
            style={{
              textAlign: 'left',
              background: 'var(--hpgk-surface-elevated)',
              border: '1px solid var(--hpgk-border)',
              borderRadius: 'var(--radius-m)',
              padding: 14,
              cursor: 'pointer',
              color: 'var(--hpgk-text)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <strong>{r.entry.title}</strong>
              <span style={{ color: 'var(--hpgk-muted-2)', fontSize: '0.78rem' }}>{r.entry.domain}</span>
            </div>
            <p style={{ color: 'var(--hpgk-muted)', fontSize: '0.85rem', margin: 0 }}>{r.entry.concept}</p>
          </button>
        ))}
      </div>

      {selected && <ConceptDetail entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: 'var(--hpgk-surface-elevated)',
        border: '1px solid var(--hpgk-border)',
        borderRadius: 'var(--radius-m)',
        padding: '12px 18px',
        minWidth: 120,
      }}
    >
      <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{value}</div>
      <div style={{ color: 'var(--hpgk-muted)', fontSize: '0.8rem' }}>{label}</div>
    </div>
  );
}

function ConceptDetail({ entry, onClose }: { entry: KnowledgeEntry; onClose: () => void }) {
  return (
    <div
      style={{
        marginTop: 20,
        background: 'var(--hpgk-surface-elevated)',
        border: '1px solid var(--hpgk-border-strong)',
        borderRadius: 'var(--radius-l)',
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>{entry.title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--hpgk-muted)', cursor: 'pointer' }}>
          ✕
        </button>
      </div>
      <p style={{ color: 'var(--hpgk-cyan)', fontSize: '0.8rem', marginTop: 0 }}>{entry.domain}</p>

      <Section title="Khái niệm" text={entry.concept} />
      <Section title="Tại sao" text={entry.why} />
      <Section title="Cách áp dụng" text={entry.how} />
      <ListSection title="Best practices" items={entry.best_practices} />
      <ListSection title="Lỗi thường gặp" items={entry.common_mistakes} />
      <ListSection title="Đánh đổi" items={entry.tradeoffs} />
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <h3 style={{ fontSize: '0.85rem', color: 'var(--hpgk-muted)', margin: '0 0 4px' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <h3 style={{ fontSize: '0.85rem', color: 'var(--hpgk-muted)', margin: '0 0 4px' }}>{title}</h3>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.9rem', lineHeight: 1.6 }}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
