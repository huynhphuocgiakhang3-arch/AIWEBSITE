import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const apiKey = String(body.apiKey ?? process.env.GEMINI_API_KEY ?? '').trim();
  const model = String(body.model ?? process.env.GEMINI_MODEL ?? 'gemini-3.7-flash').trim();
  const messages = Array.isArray(body.messages) ? body.messages as Message[] : [];
  if (!apiKey) return NextResponse.json({ error: 'Chưa có Gemini API key.' }, { status: 400 });
  if (!messages.length) return NextResponse.json({ error: 'Chưa có messages.' }, { status: 400 });

  const system = messages.find((m) => m.role === 'system')?.content;
  const contents = messages.filter((m) => m.role !== 'system').map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents,
      generationConfig: { temperature: 0.35, maxOutputTokens: 4096 },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json({ error: data?.error?.message ?? `Gemini HTTP ${response.status}` }, { status: response.status });
  }
  const content = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  if (!content) return NextResponse.json({ error: 'Gemini không trả về nội dung.' }, { status: 502 });
  return NextResponse.json({ ok: true, content, model });
}
