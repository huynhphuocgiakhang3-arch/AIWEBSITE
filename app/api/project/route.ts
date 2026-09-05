import {NextRequest,NextResponse} from "next/server";
import JSZip from "jszip";
const MAX=40*1024*1024, MAX_ENTRIES=6000;
export async function POST(req:NextRequest){
 const f=(await req.formData()).get("file");
 if(!(f instanceof File))return NextResponse.json({ok:false,error:"Thiếu file"},{status:400});
 if(f.size>MAX)return NextResponse.json({ok:false,error:"File vượt giới hạn 40 MB"},{status:413});
 const isZip=/\.zip$/i.test(f.name)||f.type.includes("zip");
 if(!isZip)return NextResponse.json({ok:true,name:f.name,size:f.size,files:[f.name],summary:"Đã nhận tệp. HPGK sẵn sàng đưa tệp vào context."});
 try{
  const zip=await JSZip.loadAsync(await f.arrayBuffer(),{checkCRC32:false});
  const names=Object.keys(zip.files); if(names.length>MAX_ENTRIES) return NextResponse.json({ok:false,error:"ZIP có quá nhiều mục"},{status:413});
  const files=names.filter(n=>!zip.files[n].dir).slice(0,MAX_ENTRIES);
  const ext=(n:string)=>n.includes(".")?n.split(".").pop()!.toLowerCase():"other";
  const byType=Object.fromEntries([...new Set(files.map(ext))].map(e=>[e,files.filter(n=>ext(n)===e).length]));
  const important=files.filter(n=>/\.(ts|tsx|js|jsx|css|html|json|md|sql|py|go|rs)$/i.test(n)).slice(0,200);
  return NextResponse.json({ok:true,name:f.name,size:f.size,entries:names.length,files,byType,important,summary:`Đã lập chỉ mục ${files.length.toLocaleString("vi-VN")} tệp từ project.`});
 }catch{return NextResponse.json({ok:false,error:"ZIP không hợp lệ hoặc không thể đọc an toàn"},{status:400})}
}
export async function GET(){return NextResponse.json({ok:true,limits:{maxBytes:MAX,maxEntries:MAX_ENTRIES},mode:"server-side ZIP inspection"})}
