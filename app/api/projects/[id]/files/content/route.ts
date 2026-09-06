import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createJsonTable } from '../../../../../../lib/db';
import { resolveSafe } from '../../../../../../core/agent/tools/workspace-path';
import type { ProjectRecord } from '../../../../../../lib/project-types';

const DATA_DIR = process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data');
const projectsTable = createJsonTable<ProjectRecord>(DATA_DIR, 'projects');
const MAX_VIEWABLE_SIZE = 500_000;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');
  if (!filePath) return NextResponse.json({ error: 'Thiếu tham số path.' }, { status: 400 });

  const project = await projectsTable.get(params.id);
  if (!project) return NextResponse.json({ error: 'Không tìm thấy project.' }, { status: 404 });

  try {
    const target = resolveSafe(project.workspaceDir, filePath);
    const stat = await fs.stat(target);
    if (stat.size > MAX_VIEWABLE_SIZE) {
      return NextResponse.json({ error: `File quá lớn để xem trực tiếp (${stat.size} bytes).` }, { status: 413 });
    }
    const content = await fs.readFile(target, 'utf-8');
    return NextResponse.json({ path: filePath, content });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
