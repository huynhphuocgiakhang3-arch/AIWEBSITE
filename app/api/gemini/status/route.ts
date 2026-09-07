import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const apiKey = String(body.apiKey ?? process.env.GEMINI_API_KEY ?? '').trim();
  const model = String(body.model ?? process.env.GEMINI_MODEL ?? 'gemini-3.8-flash').trim();
  if (!apiKey) return NextResponse.json({ ok:false, error:'Chưa có Gemini API key.' }, { status:400 });
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method:'POST', headers:{'content-type':'application/json','x-goog-api-key':apiKey}, body:JSON.stringify({contents:[{role:'user',parts:[{text:'Reply with exactly: OK'}]}],generationConfig:{maxOutputTokens:8}}), cache:'no-store' });
    const d = await r.json().catch(()=>({}));
    if(!r.ok) return NextResponse.json({ok:false,model,error:d?.error?.message ?? `Gemini HTTP ${r.status}`},{status:r.status});
    const reply=d?.candidates?.[0]?.content?.parts?.map((p:{text?:string})=>p.text??'').join('').trim()??'';
    if(!reply) return NextResponse.json({ok:false,model,error:'Gemini không trả về nội dung.'},{status:502});
    return NextResponse.json({ok:true,model,reply});
  } catch(e) { return NextResponse.json({ok:false,model,error:e instanceof Error?e.message:'Không thể kết nối Gemini.'},{status:502}); }
}
