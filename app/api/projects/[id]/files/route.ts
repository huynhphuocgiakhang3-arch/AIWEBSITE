import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createJsonTable } from '../../../../../lib/db';
import type { ProjectRecord } from '../../../../../lib/project-types';

const DATA_DIR = process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data');
const projectsTable = createJsonTable<ProjectRecord>(DATA_DIR, 'projects');

async function listFiles(dir: string, base: string): Promise<string[]> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const results: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFiles(fullPath, base)));
    } else {
      results.push(path.relative(base, fullPath));
    }
  }
  return results.sort();
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = await projectsTable.get(params.id);
  if (!project) return NextResponse.json({ error: 'Không tìm thấy project.' }, { status: 404 });

  const files = await listFiles(project.workspaceDir, project.workspaceDir);
  return NextResponse.json({ files });
}
