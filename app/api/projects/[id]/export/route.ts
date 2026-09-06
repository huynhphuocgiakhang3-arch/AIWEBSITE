import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import AdmZip from 'adm-zip';
import { createJsonTable } from '@/lib/db';
import type { ProjectRecord } from '@/lib/project-types';

const DATA_DIR = process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data');
const projectsTable = createJsonTable<ProjectRecord>(DATA_DIR, 'projects');

/**
 * ⚠️ CHƯA ĐƯỢC CHẠY/KIỂM CHỨNG trong sandbox này (phụ thuộc adm-zip, cần
 * npm install). Logic dùng đúng API addLocalFolder + toBuffer của adm-zip.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = await projectsTable.get(params.id);
  if (!project) {
    return NextResponse.json({ error: 'Không tìm thấy project.' }, { status: 404 });
  }

  const exists = await fs
    .access(project.workspaceDir)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    return NextResponse.json({ error: 'Project chưa có file nào để export.' }, { status: 400 });
  }

  const zip = new AdmZip();
  zip.addLocalFolder(project.workspaceDir);
  const buffer = zip.toBuffer();

  return new NextResponse(buffer, {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${project.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.zip"`,
    },
  });
}
