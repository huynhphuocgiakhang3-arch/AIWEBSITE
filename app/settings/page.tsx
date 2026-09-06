import { loadKnowledgeBase } from '../../core/knowledge/index';
import { getKnowledgeStats } from '../../core/knowledge/retrieval';

export default async function SettingsPage() {
  const aiConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  const { entries, issues } = await loadKnowledgeBase();
  const stats = getKnowledgeStats(entries);

  return (
    <div className="main-scroll">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 20px' }}>Cài đặt</h1>

        <SettingsSection title="AI Provider">
          <div className="panel-row">
            <span className="label">Trạng thái</span>
            <span className={`val ${aiConfigured ? '' : 'pending'}`}>
              {aiConfigured ? 'Đã cấu hình (Anthropic)' : 'Chưa cấu hình'}
            </span>
          </div>
          <div className="panel-row">
            <span className="label">Model</span>
            <span className="val">{process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'}</span>
          </div>
          {!aiConfigured && (
            <p style={{ color: 'var(--hpgk-muted)', fontSize: '0.82rem', marginTop: 8 }}>
              Thêm <code>ANTHROPIC_API_KEY</code> vào file <code>.env.local</code> rồi khởi động lại server để kích hoạt chat thật.
            </p>
          )}
        </SettingsSection>

        <SettingsSection title="Knowledge Core">
          <div className="panel-row">
            <span className="label">Tổng số mục</span>
            <span className="val">{stats.totalEntries}</span>
          </div>
          <div className="panel-row">
            <span className="label">Số domain</span>
            <span className="val">{stats.domains}</span>
          </div>
          <div className="panel-row">
            <span className="label">Vấn đề khi nạp dữ liệu</span>
            <span className="val" style={{ color: issues.length > 0 ? 'var(--hpgk-warning)' : undefined }}>
              {issues.length}
            </span>
          </div>
        </SettingsSection>

        <SettingsSection title="Lưu trữ">
          <div className="panel-row">
            <span className="label">Thư mục dữ liệu</span>
            <span className="val">{process.env.HPGK_DATA_DIR ?? './data'}</span>
          </div>
          <div className="panel-row">
            <span className="label">Loại lưu trữ</span>
            <span className="val">JSON file (v1)</span>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 16,
        padding: 16,
        border: '1px solid var(--hpgk-border)',
        borderRadius: 'var(--radius-m)',
        background: 'var(--hpgk-surface-elevated)',
      }}
    >
      <h2 style={{ fontSize: '0.9rem', margin: '0 0 10px', color: 'var(--hpgk-muted)' }}>{title}</h2>
      {children}
    </section>
  );
}
