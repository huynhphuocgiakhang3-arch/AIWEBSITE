import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { createJsonTable } from '../../../../lib/db';
import { analyzeAndExtractZip } from '../../../../lib/zip';
import type { ProjectRecord } from '../../../../lib/project-types';

const DATA_DIR = process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data');
const projectsTable = createJsonTable<ProjectRecord>(DATA_DIR, 'projects');
const MAX_UPLOAD_SIZE = Number(process.env.HPGK_MAX_UPLOAD_SIZE ?? 100 * 1024 * 1024);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const projectId = formData.get('projectId');
  const file = formData.get('file');

  if (typeof projectId !== 'string' || !projectId) {
    return NextResponse.json({ error: 'Thiếu projectId.' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Thiếu file ZIP.' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: `File vượt giới hạn ${MAX_UPLOAD_SIZE} bytes.` }, { status: 413 });
  }

  const project = await projectsTable.get(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Không tìm thấy project.' }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let result;
  try {
    result = await analyzeAndExtractZip(buffer, project.workspaceDir);
  } catch (err) {
    // KHÔNG báo "thành công" nếu extraction thật sự lỗi — trả lỗi rõ ràng.
    return NextResponse.json(
      { error: `Lỗi khi xử lý ZIP: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.rejectionSummary }, { status: 400 });
  }

  const now = new Date().toISOString();
  await projectsTable.update(projectId, {
    detectedStack: result.detectedStack,
    fileCount: result.extractedFiles.length,
    updatedAt: now,
  });

  return NextResponse.json({
    ok: true,
    fileCount: result.extractedFiles.length,
    detectedStack: result.detectedStack,
    totalUncompressedSize: result.totalUncompressedSize,
  });
}
