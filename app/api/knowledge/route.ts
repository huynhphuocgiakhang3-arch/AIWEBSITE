import {NextRequest,NextResponse} from "next/server";
import {retrieve,stats} from "../../../knowledge/retrieval";
export async function GET(req:NextRequest){const q=req.nextUrl.searchParams.get("q")||"";const domain=req.nextUrl.searchParams.get("domain")||undefined;return NextResponse.json({ok:true,stats:stats(),results:q?retrieve(q,16,domain):[]});}
export async function POST(req:NextRequest){const body=await req.json().catch(()=>({}));const q=typeof body.q==="string"?body.q:"";return NextResponse.json({ok:true,query:q,results:q?retrieve(q,16,body.domain):[],stats:stats()});}
