import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import crypto from 'node:crypto';
import { createJsonTable } from '../../../lib/db';
import type { ProjectRecord } from '../../../lib/project-types';

const DATA_DIR = process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data');
const projectsTable = createJsonTable<ProjectRecord>(DATA_DIR, 'projects');

export async function GET() {
  const projects = await projectsTable.all();
  return NextResponse.json({ projects: projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { name: string; description?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Thiếu tên project.' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const workspaceDir = path.join(process.env.HPGK_WORKSPACE_DIR ?? path.join(DATA_DIR, 'workspaces'), id);

  const project: ProjectRecord = {
    id,
    name: body.name.trim(),
    description: body.description?.trim() ?? '',
    workspaceDir,
    detectedStack: [],
    fileCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await projectsTable.insert(project);
  return NextResponse.json({ project }, { status: 201 });
}
