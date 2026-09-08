import {NextRequest,NextResponse} from 'next/server';
import {analyzeProject,applySafeFixes,ProjectFile} from '../../../../lib/forensic';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{const b=await req.json();const files=(b.files||[]) as ProjectFile[];const log=String(b.log||'');if(!Array.isArray(files))return NextResponse.json({error:'files phải là array'},{status:400});const findings=analyzeProject(files,log);const result=applySafeFixes(files,findings);return NextResponse.json({ok:true,findings,result});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'fix failed'},{status:500})}}
