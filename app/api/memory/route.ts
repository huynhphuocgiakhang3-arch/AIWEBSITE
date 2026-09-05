export async function GET(){return Response.json({ok:true,mode:"local-browser",message:"Memory được lưu phía trình duyệt trong bản không cần AI API."})}
export async function POST(req:Request){const body=await req.json().catch(()=>({}));return Response.json({ok:true,saved:Boolean(body?.text),memory:{text:body?.text||"",createdAt:new Date().toISOString()}})}
