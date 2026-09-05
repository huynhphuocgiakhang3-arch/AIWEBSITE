import fs from "node:fs";
import path from "node:path";
type Item={id:string;domain:string;title:string;terms:string[]};
type Entry=Record<string,any>;
const root=path.join(process.cwd(),"knowledge");
let indexCache:any=null; const packCache=new Map<string,Entry[]>();
const norm=(s:string)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const tokens=(s:string)=>norm(s).split(/[^a-z0-9]+/).filter(x=>x.length>1);
function index(){return indexCache ||= JSON.parse(fs.readFileSync(path.join(root,"index.json"),"utf8"))}
function pack(domain:string){if(!packCache.has(domain)){const p=index().manifest.packs[domain];packCache.set(domain,JSON.parse(fs.readFileSync(path.join(root,"packs",p),"utf8")).entries)}return packCache.get(domain)!}
export function retrieve(q:string,limit=12,domain?:string){
 const clean=norm(q),ts=tokens(q); if(!ts.length)return [];
 const items:Item[]=index().items;
 const ranked=items.filter(x=>!domain||x.domain===domain).map(x=>{
   const title=norm(x.title), terms=(x.terms||[]).map(norm); let score=0;
   if(title===clean)score+=100;if(title.includes(clean))score+=35;
   for(const t of ts){if(title.includes(t))score+=12;if(terms.includes(t))score+=7;else if(terms.some(v=>v.includes(t)))score+=3}
   score += Math.min(10, Math.max(0, 10-ts.length));
   return {...x,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,Math.max(limit*4,32));
 const domains=[...new Set(ranked.map(x=>x.domain))],byId=new Map<string,Entry>();
 for(const d of domains)for(const e of pack(d))byId.set(e.id,e);
 return ranked.slice(0,limit).map(x=>({...byId.get(x.id),score:x.score}));
}
export function stats(){const m=index().manifest;return {entries:m.entries,domains:m.domains,packs:Object.keys(m.packs).length,mode:"lazy-pack + lexical rerank",cache:"memory"}}
