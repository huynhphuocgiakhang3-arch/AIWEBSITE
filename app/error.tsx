"use client";
import {useEffect} from "react";
export default function GlobalError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
 useEffect(()=>{console.error("HPGK client error",error)},[error]);
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#03050b",color:"#f4f7ff",fontFamily:"system-ui",padding:24}}>
  <section style={{maxWidth:620,textAlign:"center",padding:28,border:"1px solid rgba(255,255,255,.1)",borderRadius:18,background:"#080d17"}}>
   <div style={{fontSize:12,letterSpacing:".18em",color:"#7c8aa4"}}>HPGK · KHÔI PHỤC ỨNG DỤNG</div>
   <h1 style={{fontSize:26,margin:"14px 0 8px"}}>Đã xảy ra lỗi phía trình duyệt</h1>
   <p style={{color:"#7f8aa0",lineHeight:1.6,fontSize:13}}>HPGK đã chặn lỗi để tránh trang trắng. Hãy thử tải lại phiên làm việc.</p>
   <button onClick={()=>reset()} style={{marginTop:14,padding:"10px 16px",border:0,borderRadius:10,cursor:"pointer",background:"#f2f5ff",color:"#111522",fontWeight:700}}>Thử lại</button>
  </section>
 </main>
}
