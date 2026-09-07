import { NextRequest, NextResponse } from 'next/server';

function localReply(input:string){
  const p=input.toLowerCase();
  if(/create|build|website|web|project|app|landing|dashboard/.test(p)) return 'HPGK Local Engine: I can turn this request into a deterministic project scaffold, inspect the generated files, and open a live preview. No external AI API is required in local mode.';
  if(/fix|bug|error|broken/.test(p)) return 'HPGK Local Engine: diagnostics workflow ready — inspect → isolate → patch → verify. External model APIs are disabled in the default build.';
  if(/learn|research|study/.test(p)) return 'HPGK Local Engine: learning workflow ready — collect → evaluate → store a reusable engineering lesson locally.';
  return 'HPGK Local Engine is online. Describe a project, code change, debugging task, or learning mission to start a local workflow.';
}

export async function POST(req:NextRequest){
  const body=await req.json().catch(()=>({}));
  const messages=Array.isArray(body.messages)?body.messages:[];
  const last=messages.at(-1);
  const content=typeof last?.content==='string'?last.content:'';
  if(!content) return NextResponse.json({error:'Thiếu message.'},{status:400});
  return NextResponse.json({ok:true,content:localReply(content),model:'hpgk-local-engine',mode:'local-no-api'});
}
