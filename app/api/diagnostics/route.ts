import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createJsonTable } from '@/lib/db';
import { analyzeFiles, summarize } from '@/core/diagnostics/rules';
import type { ProjectRecord } from '@/lib/project-types';

const DATA_DIR = process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data');
const projectsTable = createJsonTable<ProjectRecord>(DATA_DIR, 'projects');
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.env']);
const MAX_FILE_SIZE_FOR_ANALYSIS = 500_000; // 500KB — tránh đọc file quá lớn vào bộ nhớ

async function walkDir(dir: string, base: string): Promise<Array<{ path: string; content: string }>> {
  const results: Array<{ path: string; content: string }> = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(base, fullPath);

    if (entry.isDirectory()) {
      results.push(...(await walkDir(fullPath, base)));
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      const stat = await fs.stat(fullPath);
      if (stat.size <= MAX_FILE_SIZE_FOR_ANALYSIS) {
        const content = await fs.readFile(fullPath, 'utf-8');
        results.push({ path: relPath, content });
      }
    }
  }
  return results;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'Thiếu projectId.' }, { status: 400 });
  }

  const project = await projectsTable.get(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Không tìm thấy project.' }, { status: 404 });
  }

  const files = await walkDir(project.workspaceDir, project.workspaceDir);
  const issues = analyzeFiles(files);
  const summary = summarize(issues);

  return NextResponse.json({ issues, summary, filesAnalyzed: files.length });
}
