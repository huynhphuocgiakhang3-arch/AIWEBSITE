import { loadKnowledgeBase } from '@/core/knowledge/index';
import { getKnowledgeStats } from '@/core/knowledge/retrieval';
import { KnowledgeSearch } from '@/components/knowledge/KnowledgeSearch';

export default async function KnowledgePage() {
  const { entries, issues } = await loadKnowledgeBase();
  const stats = getKnowledgeStats(entries);

  return (
    <div className="main-scroll">
      <div style={{ maxWidth: 760, margin: '0 auto 24px' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 6px' }}>Cơ sở tri thức</h1>
        <p style={{ color: 'var(--hpgk-muted)', margin: 0, fontSize: '0.9rem' }}>
          {stats.totalEntries} mục tri thức thật, biên soạn thủ công, trên {stats.domains} domain — hoạt động offline, không cần AI provider.
        </p>
        {issues.length > 0 && (
          <p style={{ color: 'var(--hpgk-warning)', fontSize: '0.82rem', marginTop: 8 }}>
            ⚠️ Phát hiện {issues.length} vấn đề khi nạp dữ liệu tri thức — xem log server để biết chi tiết.
          </p>
        )}
      </div>
      <KnowledgeSearch initialStats={stats} />
    </div>
  );
}
