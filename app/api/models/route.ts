import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({mode:'local-no-api',providers:[{id:'hpgk-local-engine',configured:true,type:'deterministic-local'}]});}
