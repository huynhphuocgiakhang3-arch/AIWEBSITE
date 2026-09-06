import "./globals.css";
import type {Metadata} from "next";

export const metadata:Metadata={title:"HPGK — Intelligence Engine",description:"Premium AI engineering workspace"};

const debugScript = `
(function(){
  try {
    var logs=[];
    var max=80;
    function safe(v){ try{return typeof v==='string'?v:JSON.stringify(v,null,2)}catch(e){return String(v)} }
    function push(type,args){
      logs.push({type:type,time:new Date().toLocaleTimeString(),text:Array.prototype.map.call(args,safe).join(' ')});
      if(logs.length>max) logs.shift();
      window.__HPGK_DEBUG_LOGS__=logs;
    }
    function panel(){
      var old=document.getElementById('__hpgk_debug__'); if(old) old.remove();
      var box=document.createElement('div'); box.id='__hpgk_debug__';
      box.style.cssText='position:fixed;z-index:2147483647;inset:12px 10px auto 10px;max-height:78vh;overflow:auto;background:#080b12;color:#eef2ff;border:1px solid #ff5470;border-radius:16px;padding:14px;font:12px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 20px 80px #000c;white-space:pre-wrap;word-break:break-word';
      var title=document.createElement('div'); title.textContent='🔴 HPGK DEBUG — LỖI TRÊN THIẾT BỊ'; title.style.cssText='font-weight:800;font-size:15px;margin-bottom:8px;color:#ff8094'; box.appendChild(title);
      var hint=document.createElement('div'); hint.textContent='Đây là lỗi JavaScript phía trình duyệt. Chụp màn hình toàn bộ bảng này và gửi cho ChatGPT.'; hint.style.cssText='color:#aeb8cb;margin-bottom:10px'; box.appendChild(hint);
      var close=document.createElement('button'); close.textContent='Đóng bảng lỗi'; close.style.cssText='padding:8px 10px;border:1px solid #ffffff22;border-radius:9px;background:#ffffff0a;color:#fff;margin-right:6px'; close.onclick=function(){box.remove()}; box.appendChild(close);
      var clear=document.createElement('button'); clear.textContent='Xóa dữ liệu HPGK'; clear.style.cssText='padding:8px 10px;border:1px solid #ff547055;border-radius:9px;background:#ff547012;color:#ff9aab'; clear.onclick=function(){try{localStorage.clear()}catch(e){} location.reload()}; box.appendChild(clear);
      var pre=document.createElement('pre'); pre.style.cssText='margin-top:12px;color:#f2f5ff;background:#03050a;border-radius:10px;padding:11px;overflow:auto';
      var err=window.__HPGK_DEBUG_LAST__||{};
      pre.textContent='TYPE: '+(err.type||'unknown')+'\\nTIME: '+(err.time||'')+'\\nMESSAGE: '+(err.message||'')+'\\n\\nSTACK:\\n'+(err.stack||'')+'\\n\\nRECENT LOGS:\\n'+(logs.length?logs.map(function(x){return '['+x.time+'] '+x.type+': '+x.text}).join('\\n'):'(none)');
      box.appendChild(pre); document.body.appendChild(box);
    }
    function capture(type,message,stack){
      window.__HPGK_DEBUG_LAST__={type:type,time:new Date().toLocaleTimeString(),message:String(message||''),stack:String(stack||'')};
      push(type,[message,stack||'']);
      setTimeout(panel,0);
    }
    var oldErr=console.error; console.error=function(){push('console.error',arguments);oldErr.apply(console,arguments)};
    window.addEventListener('error',function(e){capture('window.error',e.message||e.error,e.error&&e.error.stack)});
    window.addEventListener('unhandledrejection',function(e){var r=e.reason;capture('unhandledrejection',r&&r.message?r.message:r,r&&r.stack)});
    window.addEventListener('load',function(){
      var b=document.createElement('button'); b.textContent='HPGK DEBUG'; b.style.cssText='position:fixed;z-index:2147483646;right:10px;bottom:10px;padding:7px 9px;border:1px solid #ffffff18;border-radius:9px;background:#080b12e8;color:#7d8aa2;font:10px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;opacity:.75';
      b.onclick=function(){panel()}; document.body.appendChild(b);
    });
  }catch(e){}
})();
`;

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="vi"><body><script dangerouslySetInnerHTML={{__html:debugScript}} />{children}</body></html>
}
