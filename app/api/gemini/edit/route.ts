import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type FileItem = { path: string; content: string };
const MAX_FILES = 80;
const MAX_TOTAL = 900_000;

function safePath(p: string) {
  const normalized = p.replace(/\\/g, '/').replace(/^\/+/, '');
  return normalized && !normalized.includes('..') && !normalized.startsWith('.git/') && !normalized.includes('\0');
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const apiKey = String(body.apiKey ?? process.env.GEMINI_API_KEY ?? '').trim();
  const model = String(body.model ?? process.env.GEMINI_MODEL ?? 'gemini-3.8-flash').trim();
  const instruction = String(body.instruction ?? '').trim();
  const files = Array.isArray(body.files) ? body.files as FileItem[] : [];
  if (!apiKey) return NextResponse.json({ error: 'Chưa có Gemini API key.' }, { status: 400 });
  if (!instruction) return NextResponse.json({ error: 'Thiếu yêu cầu sửa project.' }, { status: 400 });
  if (files.length > MAX_FILES || files.some((f) => !f || typeof f.path !== 'string' || typeof f.content !== 'string' || !safePath(f.path))) {
    return NextResponse.json({ error: 'Project files không hợp lệ hoặc quá lớn.' }, { status: 400 });
  }
  if (files.reduce((n, f) => n + f.content.length, 0) > MAX_TOTAL) {
    return NextResponse.json({ error: 'Project quá lớn cho một lượt chỉnh sửa Gemini.' }, { status: 413 });
  }

  const prompt = `You are HPGK, a senior software engineer. Modify the provided project to satisfy the user's request. Return ONLY valid JSON matching this shape: {"summary":"short Vietnamese summary","operations":[{"action":"write","path":"relative/path","content":"full file content"},{"action":"delete","path":"relative/path"}]}. Only include files that must change. Preserve the existing architecture unless the request requires otherwise. Never write outside the project, never touch .git, and never include markdown fences.\n\nUSER REQUEST:\n${instruction}\n\nPROJECT FILES:\n${files.map((f) => `--- ${f.path}\n${f.content}`).join('\n')}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 16000,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            operations: { type: 'array', items: { type: 'object', properties: { action: { type: 'string', enum: ['write', 'delete'] }, path: { type: 'string' }, content: { type: 'string' } }, required: ['action', 'path'] } } },
          required: ['summary', 'operations'],
        },
      },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: data?.error?.message ?? `Gemini HTTP ${response.status}` }, { status: response.status });
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  try {
    const result = JSON.parse(text) as { summary: string; operations: Array<{ action: 'write' | 'delete'; path: string; content?: string }> };
    const operations = result.operations.filter((op) => safePath(op.path) && (op.action === 'delete' || typeof op.content === 'string'));
    return NextResponse.json({ ok: true, model, summary: result.summary, operations });
  } catch {
    return NextResponse.json({ error: 'Gemini trả về JSON không hợp lệ.' }, { status: 502 });
  }
}
