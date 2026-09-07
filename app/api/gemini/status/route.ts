import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value: unknown) { return String(value ?? '').trim(); }

function classify(status: number, message: string) {
  const m = message.toLowerCase();
  if (status === 401) return { code: 'INVALID_KEY', title: 'API key không hợp lệ', detail: 'Gemini không chấp nhận API key này.' };
  if (status === 403 && /denied access|permission_denied|permission denied/.test(m)) return { code: 'PROJECT_DENIED', title: 'Project bị từ chối quyền truy cập', detail: 'Key đã được nhận nhưng Google đang từ chối quyền gọi model của project. Đây không phải lỗi UI HPGK.' };
  if (status === 403) return { code: 'FORBIDDEN', title: 'Bị từ chối quyền', detail: message };
  if (status === 404) return { code: 'MODEL_UNAVAILABLE', title: 'Model không khả dụng', detail: message };
  if (status === 429) return { code: 'QUOTA', title: 'Hết quota / rate limit', detail: message };
  if (status >= 500) return { code: 'GEMINI_SERVER', title: 'Gemini đang lỗi máy chủ', detail: message };
  return { code: 'GEMINI_ERROR', title: `Gemini HTTP ${status}`, detail: message };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const apiKey = clean(body.apiKey || process.env.GEMINI_API_KEY);
  const model = clean(body.model || process.env.GEMINI_MODEL || 'gemini-3.8-flash');
  if (!apiKey) return NextResponse.json({ ok: false, stage: 'credentials', code: 'NO_KEY', title: 'Chưa có API key', detail: 'Thêm GEMINI_API_KEY trên Vercel hoặc nhập key cho phiên này.' }, { status: 400 });

  // Step 1: prove the key can authenticate and the project can enumerate models.
  const listRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=20', {
    headers: { 'x-goog-api-key': apiKey },
    cache: 'no-store',
  });
  const listData = await listRes.json().catch(() => ({}));
  if (!listRes.ok) {
    const message = clean(listData?.error?.message || `Gemini HTTP ${listRes.status}`);
    const reason = classify(listRes.status, message);
    return NextResponse.json({ ok: false, stage: 'authentication', model, ...reason }, { status: listRes.status });
  }

  const models = Array.isArray(listData?.models) ? listData.models : [];
  const available = models.some((m: { name?: string }) => m.name === `models/${model}`);

  // Step 2: a tiny real generation request. Listing models alone is not enough.
  const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: HPGK_OK' }] }], generationConfig: { maxOutputTokens: 8 } }),
    cache: 'no-store',
  });
  const testData = await testRes.json().catch(() => ({}));
  if (!testRes.ok) {
    const message = clean(testData?.error?.message || `Gemini HTTP ${testRes.status}`);
    const reason = classify(testRes.status, message);
    return NextResponse.json({ ok: false, stage: 'generateContent', model, modelListed: available, ...reason }, { status: testRes.status });
  }

  const output = testData?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('').trim() || '';
  return NextResponse.json({ ok: true, stage: 'generateContent', model, modelListed: available, output, title: 'Gemini đang hoạt động', detail: `Request thật tới ${model} đã thành công.` });
}
