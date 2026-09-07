import { NextRequest, NextResponse } from 'next/server';

export async function POST(req:NextRequest){
  const body=await req.json().catch(()=>({}));
  const prompt=String(body.prompt??'').trim();
  if(!prompt) return NextResponse.json({error:'Thiếu prompt.'},{status:400});
  const steps=['understand','plan','generate','diagnose','review','verify'];
  return NextResponse.json({ok:true,mode:'local-no-api',mission:{prompt,steps,status:'planned',progress:0},message:'Local mission created. The browser workspace executes the visible deterministic workflow without an external AI API.'});
}
