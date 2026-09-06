'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ProjectRecord } from '@/lib/project-types';
import type { DiagnosticIssue, DiagnosticsSummary } from '@/core/diagnostics/rules';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<DiagnosticIssue[]>([]);
  const [summary, setSummary] = useState<DiagnosticsSummary | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  const loadProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${params.id}`);
    const data = await res.json();
    setProject(data.project ?? null);
  }, [params.id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);
    const formData = new FormData();
    formData.append('projectId', params.id);
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload/zip', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadMessage(`Bị từ chối: ${data.error}`);
      } else {
        setUploadMessage(`Đã phân tích ${data.fileCount} file. Stack phát hiện: ${data.detectedStack.map((s: { name: string }) => s.name).join(', ') || 'không xác định'}.`);
        loadProject();
      }
    } catch (err) {
      setUploadMessage(`Lỗi upload: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleRunDiagnostics() {
    setRunningDiagnostics(true);
    const res = await fetch(`/api/diagnostics?projectId=${params.id}`);
    const data = await res.json();
    setIssues(data.issues ?? []);
    setSummary(data.summary ?? null);
    setRunningDiagnostics(false);
  }

  if (!project) return <div className="main-scroll"><p style={{ color: 'var(--hpgk-muted)' }}>Đang tải…</p></div>;

  return (
    <div className="main-scroll">
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 4px' }}>{project.name}</h1>
        <p style={{ color: 'var(--hpgk-muted)', fontSize: '0.88rem', marginTop: 0 }}>{project.description || 'Không có mô tả'}</p>

        <section style={{ marginTop: 24, padding: 16, border: '1px solid var(--hpgk-border)', borderRadius: 'var(--radius-m)', background: 'var(--hpgk-surface-elevated)' }}>
          <h2 style={{ fontSize: '0.95rem', margin: '0 0 10px' }}>Upload ZIP để phân tích</h2>
          <input type="file" accept=".zip" onChange={handleUpload} disabled={uploading} />
          {uploading && <p style={{ color: 'var(--hpgk-muted)', fontSize: '0.85rem' }}>Đang tải lên và kiểm tra an toàn…</p>}
          {uploadMessage && <p style={{ fontSize: '0.85rem', marginTop: 8 }}>{uploadMessage}</p>}
        </section>

        <section style={{ marginTop: 16, padding: 16, border: '1px solid var(--hpgk-border)', borderRadius: 'var(--radius-m)', background: 'var(--hpgk-surface-elevated)' }}>
          <h2 style={{ fontSize: '0.95rem', margin: '0 0 10px' }}>Stack đã phát hiện</h2>
          {project.detectedStack.length === 0 ? (
            <p style={{ color: 'var(--hpgk-muted)', fontSize: '0.85rem' }}>Chưa có dữ liệu — upload ZIP để phân tích.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.88rem' }}>
              {project.detectedStack.map((s) => (
                <li key={s.name}>
                  {s.name} <span style={{ color: 'var(--hpgk-muted-2)' }}>({s.confidence === 'high' ? 'độ tin cậy cao' : 'độ tin cậy trung bình'})</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={{ marginTop: 16, padding: 16, border: '1px solid var(--hpgk-border)', borderRadius: 'var(--radius-m)', background: 'var(--hpgk-surface-elevated)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.95rem', margin: 0 }}>Diagnostics</h2>
            <button
              onClick={handleRunDiagnostics}
              disabled={runningDiagnostics}
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-s)', border: '1px solid var(--hpgk-border-strong)', background: 'none', color: 'var(--hpgk-text)', cursor: 'pointer', fontSize: '0.82rem' }}
            >
              {runningDiagnostics ? 'Đang chạy…' : 'Chạy kiểm tra'}
            </button>
          </div>
          {summary && (
            <p style={{ fontSize: '0.85rem', marginTop: 10 }}>
              Tổng {summary.totalIssues} vấn đề — {summary.bySeverity.error} error, {summary.bySeverity.warning} warning, {summary.bySeverity.info} info
            </p>
          )}
          {issues.length > 0 && (
            <div style={{ marginTop: 8, maxHeight: 260, overflowY: 'auto' }}>
              {issues.map((issue, i) => (
                <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--hpgk-border)', fontSize: '0.82rem' }}>
                  <span style={{ color: issue.severity === 'error' ? 'var(--hpgk-error)' : issue.severity === 'warning' ? 'var(--hpgk-warning)' : 'var(--hpgk-muted)' }}>
                    [{issue.severity.toUpperCase()}]
                  </span>{' '}
                  {issue.file}:{issue.line} — {issue.description}
                </div>
              ))}
            </div>
          )}
        </section>

        <a
          href={`/api/projects/${project.id}/export`}
          style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '10px 18px',
            borderRadius: 'var(--radius-s)',
            border: '1px solid var(--hpgk-border-strong)',
            color: 'var(--hpgk-text)',
            textDecoration: 'none',
            fontSize: '0.85rem',
          }}
        >
          ⬇ Xuất project thành ZIP
        </a>
      </div>
    </div>
  );
}
