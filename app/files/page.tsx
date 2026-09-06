'use client';

import { useEffect, useState } from 'react';
import type { ProjectRecord } from '@/lib/project-types';
import { FileTree } from '@/components/files/FileTree';
import { CodeViewer } from '@/components/files/CodeViewer';

export default function FilesPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setFiles([]);
      return;
    }
    fetch(`/api/projects/${projectId}/files`)
      .then((r) => r.json())
      .then((data) => setFiles(data.files ?? []));
    setSelectedFile(null);
    setFileContent(null);
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !selectedFile) return;
    fetch(`/api/projects/${projectId}/files/content?path=${encodeURIComponent(selectedFile)}`)
      .then((r) => r.json())
      .then((data) => setFileContent(data.content ?? `Lỗi: ${data.error}`));
  }, [projectId, selectedFile]);

  return (
    <div className="main-scroll">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 16px' }}>Tệp tin</h1>

        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-s)',
            border: '1px solid var(--hpgk-border)',
            background: 'var(--hpgk-surface-elevated)',
            color: 'var(--hpgk-text)',
            marginBottom: 16,
          }}
        >
          <option value="">— Chọn project —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {projectId && (
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
            <div style={{ background: 'var(--hpgk-surface-elevated)', border: '1px solid var(--hpgk-border)', borderRadius: 'var(--radius-m)', padding: 12 }}>
              <FileTree files={files} selected={selectedFile} onSelect={setSelectedFile} />
            </div>
            <div style={{ background: 'var(--hpgk-surface-elevated)', border: '1px solid var(--hpgk-border)', borderRadius: 'var(--radius-m)', padding: 14 }}>
              <CodeViewer path={selectedFile} content={fileContent} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
