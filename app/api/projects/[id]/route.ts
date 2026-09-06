import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createJsonTable } from '@/lib/db';
import type { ProjectRecord } from '@/lib/project-types';

const DATA_DIR = process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data');
const projectsTable = createJsonTable<ProjectRecord>(DATA_DIR, 'projects');

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = await projectsTable.get(params.id);
  if (!project) return NextResponse.json({ error: 'Không tìm thấy project.' }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = await projectsTable.get(params.id);
  if (!project) return NextResponse.json({ error: 'Không tìm thấy project.' }, { status: 404 });

  await projectsTable.remove(params.id);
  // Dọn luôn workspace trên đĩa — tránh rác tích luỹ theo thời gian
  await fs.rm(project.workspaceDir, { recursive: true, force: true }).catch(() => {});

  return NextResponse.json({ ok: true });
}
