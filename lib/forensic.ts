export type ProjectFile={path:string;content:string;size:number};
export type Severity='critical'|'high'|'medium'|'low'|'info';
export type Finding={id:string;severity:Severity;title:string;message:string;file?:string;line?:number;fix:string;confidence:number;rootCause:boolean;safeFix?:SafeFix};
export type SafeFix={id:string;label:string;description:string;apply:(files:ProjectFile[])=>ProjectFile[]};

const CODE=/\.(tsx?|jsx?|mjs|cjs|css|scss|json|vue|svelte)$/i;
const UI_PATH=/(^|\/)(app|pages|components|public)(\/|$)/i;
const EXCLUDED=/(^|\/)(node_modules|\.next|\.git|dist|build|coverage)(\/|$)/i;
const lineOf=(text:string,needle:string)=>{const i=text.indexOf(needle);return i<0?undefined:text.slice(0,i).split('\n').length};
const add=(a:Finding[],f:Finding)=>a.push(f);
const has=(names:Set<string>,p:string)=>[p,p+'.ts',p+'.tsx',p+'.js',p+'.jsx',p+'.mjs',p+'.cjs',p+'/index.ts',p+'/index.tsx',p+'/index.js',p+'/index.jsx','src/'+p,'src/'+p+'.ts','src/'+p+'.tsx'].some(x=>names.has(x));

export function projectManifest(files:ProjectFile[]){
  const sorted=files.filter(f=>!EXCLUDED.test(f.path)).map(f=>`${f.path}:${f.size}`).sort();
  return {fileCount:sorted.length,uiFiles:files.filter(f=>UI_PATH.test(f.path)).map(f=>f.path).sort(),signature:fnv1a(sorted.join('\n'))};
}
function fnv1a(s:string){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
function safeFinding(base:Omit<Finding,'confidence'|'rootCause'>,confidence=90,rootCause=true):Finding{return {...base,confidence,rootCause}}

export function analyzeProject(files:ProjectFile[],log=''):Finding[]{
 const out:Finding[]=[]; const names=new Set(files.map(f=>f.path));
 const pkg=files.find(f=>f.path==='package.json');
 if(!pkg) add(out,safeFinding({id:'pkg',severity:'critical',title:'Thiếu package.json',message:'Không có package.json; Vercel không có manifest chuẩn để resolve dependency/build.',fix:'Thêm package.json hợp lệ với dependencies và scripts.build.'},99));
 else try{const p=JSON.parse(pkg.content); if(!p.scripts?.build)add(out,safeFinding({id:'build-script',severity:'high',title:'Thiếu build script',file:'package.json',message:'package.json không có scripts.build.',fix:'Thêm build script phù hợp framework.',safeFix:safeBuildScript()},98)); if(p.engines?.node&&/^1[0-9]\./.test(String(p.engines.node)))add(out,safeFinding({id:'old-node',severity:'high',title:'Node.js engine quá cũ',file:'package.json',message:`engines.node = ${p.engines.node}. Có thể gây conflict với dependency/framework.`,fix:'Đồng bộ Node runtime với framework và dependency.',},86));}
 catch{add(out,safeFinding({id:'pkg-json',severity:'critical',title:'package.json không hợp lệ',file:'package.json',message:'JSON parse thất bại.',fix:'Sửa JSON trước khi deploy.'},99));}

 for(const f of files){if(!CODE.test(f.path)||EXCLUDED.test(f.path))continue;const c=f.content;
  if(/['"]use client['"]/.test(c)&&/process\.env\.[A-Z0-9_]+/.test(c)&&!/process\.env\.NEXT_PUBLIC_[A-Z0-9_]+/.test(c))add(out,safeFinding({id:'env-client-'+f.path,severity:'high',title:'Client Component đọc server env',file:f.path,line:lineOf(c,'process.env.'),message:'Client Component có truy cập process.env ngoài NEXT_PUBLIC_*.',fix:'Chuyển logic secret sang server hoặc chỉ expose NEXT_PUBLIC_*.'},94));
  for(const m of c.matchAll(/from\s+['"](@\/[^'"]+)['"]/g)){const target=m[1].slice(2);if(!has(names,target))add(out,safeFinding({id:'alias-'+f.path+'-'+target,severity:'critical',title:'Import alias không tồn tại',file:f.path,line:lineOf(c,m[1]),message:`Không tìm thấy target ${m[1]} trong source tree.`,fix:'Kiểm tra file đích, tsconfig paths và chữ hoa/chữ thường.',},98));}
  for(const m of c.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)){const dir=f.path.split('/').slice(0,-1).join('/');const raw=(dir?dir+'/':'')+m[1].replace(/^\.\//,'');const norm=raw.split('/').reduce<string[]>((a,p)=>p==='..'?a.slice(0,-1):p==='.'?a:[...a,p],[]).join('/');if(!has(names,norm))add(out,safeFinding({id:'rel-'+f.path+'-'+m[1],severity:'critical',title:'Relative import không tồn tại',file:f.path,line:lineOf(c,m[1]),message:`Không tìm thấy ${m[1]}. Linux/Vercel phân biệt hoa thường.`,fix:'Sửa path hoặc tên file; kiểm tra case-sensitive filesystem.'},98));}
  if(/(?:NEXT_PUBLIC_\w+|process\.env\.\w+)\s*[:=]\s*['"][^'"]*(?:token|secret|password|private[_-]?key)/i.test(c))add(out,safeFinding({id:'secret-'+f.path,severity:'critical',title:'Có dấu hiệu hard-code secret',file:f.path,message:'Token/secret có thể nằm trong source hoặc biến public.',fix:'Xóa secret khỏi Git, rotate token và dùng Environment Variables.'},99));
  if(/eval\s*\(|new Function\s*\(/.test(c))add(out,safeFinding({id:'eval-'+f.path,severity:'high',title:'Dynamic code execution',file:f.path,message:'eval/new Function có thể gây security/runtime issues.',fix:'Loại bỏ nếu không bắt buộc; thay bằng parser/logic an toàn.'},92));
 }
 if(log){const rules:[RegExp,string,Severity,string,number][]=[[/Module not found|Can't resolve|Cannot find module/i,'module','critical','Kiểm tra path, file, alias và case-sensitive filename.',99],[/Type error:|TS\d{3,4}/i,'typescript','critical','Sửa TypeScript error đầu tiên theo file/dòng trong log.',98],[/npm ERR!|ERESOLVE|peer dep/i,'deps','high','Đồng bộ package manager, lockfile, peer dependency và Node.',95],[/Command .* exited with code 1|Build failed/i,'build','critical','Sửa lỗi đầu tiên trước các lỗi dây chuyền.',97],[/FUNCTION_INVOCATION_FAILED|FUNCTION_INVOCATION/i,'runtime','high','Kiểm tra stack trace, env và runtime compatibility.',94],[/ENOENT|no such file or directory/i,'filesystem','critical','Kiểm tra path/case-sensitive và file có được commit.',98],[/Edge Function|edge runtime/i,'edge','high','Kiểm tra API Node-only trong Edge runtime.',94],[/Environment Variable|missing.*env|process\.env/i,'environment','high','Kiểm tra tên env, scope Production/Preview/Development và server/client.',94],[/Out of memory|JavaScript heap out of memory/i,'memory','high','Giảm memory footprint hoặc chia build/workload.',96],[/timeout|timed out/i,'timeout','high','Kiểm tra function duration, external calls và build workload.',93]];
   for(const [re,k,severity,fix,confidence] of rules)if(re.test(log))add(out,safeFinding({id:'log-'+k,severity,title:k==='module'?'Module/import failure':k==='typescript'?'TypeScript failure':k==='deps'?'Dependency resolution':k==='build'?'Build command failed':k==='runtime'?'Runtime failure':k==='filesystem'?'Filesystem/path failure':k==='edge'?'Edge runtime incompatibility':k==='environment'?'Environment variable issue':k==='memory'?'Memory exhaustion':'Timeout',message:'Deployment log chứa dấu hiệu lỗi thuộc nhóm này; ưu tiên lỗi gốc đầu tiên.',fix},confidence));
 }
 return dedupe(out).sort((a,b)=>({critical:4,high:3,medium:2,low:1,info:0}[b.severity]-({critical:4,high:3,medium:2,low:1,info:0}[a.severity])));
}
function dedupe(a:Finding[]){const seen=new Set<string>();return a.filter(x=>{const k=x.title+'|'+x.file+'|'+x.message;if(seen.has(k))return false;seen.add(k);return true})}

export function extractRootErrors(log:string){const rules:[RegExp,string][]=[[/Module not found|Can't resolve|Cannot find module/i,'module'],[/Type error:|TS\d{3,4}/i,'typescript'],[/npm ERR!|ERESOLVE|peer dep/i,'dependency'],[/Command .* exited with code 1|Build failed|Error: Command/i,'build'],[/FUNCTION_INVOCATION_FAILED|FUNCTION_INVOCATION/i,'runtime'],[/ENOENT|no such file or directory/i,'filesystem'],[/Edge Function|edge runtime/i,'edge'],[/Environment Variable|missing.*env|process\.env/i,'environment'],[/Out of memory|JavaScript heap out of memory/i,'memory'],[/timeout|timed out/i,'timeout']];return log.split(/\r?\n/).flatMap((text,i)=>{for(const [r,k] of rules)if(r.test(text))return [{line:i+1,text:text.trim().slice(0,500),kind:k}];return []}).slice(0,100)}

export function safeBuildScript():SafeFix{return {id:'next-build-script',label:'Thêm scripts.build = next build',description:'Chỉ sửa package.json khi dependency next tồn tại và build script thiếu.',apply(files){return files.map(f=>{if(f.path!=='package.json')return f;try{const p=JSON.parse(f.content);if(!(p.dependencies?.next||p.devDependencies?.next)||p.scripts?.build)return f;p.scripts={...(p.scripts||{}),build:'next build'};const content=JSON.stringify(p,null,2)+'\n';return {...f,content,size:content.length}}catch{return f}})}}}

export function applySafeFixes(files:ProjectFile[],findings:Finding[],baseline?:ReturnType<typeof projectManifest>){let next=files;const applied:string[]=[];for(const f of findings){const fix=f.safeFix;if(!fix)continue; if(f.file&&UI_PATH.test(f.file))continue;const before=JSON.stringify(next);const candidate=fix.apply(next);const afterManifest=projectManifest(candidate);if(baseline&&afterManifest.uiFiles.join('|')!==baseline.uiFiles.join('|'))continue;if(before!==JSON.stringify(candidate)){next=candidate;applied.push(fix.id)}}return {files:next,applied:[...new Set(applied)]}}
