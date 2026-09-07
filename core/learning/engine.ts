import fs from 'node:fs/promises'; import path from 'node:path';
export type LearningRecord={id:string;topic:string;source:string;summary:string;score:number;createdAt:string;tags:string[]};
const file=(root:string)=>path.join(root,'learning.json');
export async function learn(root:string,input:{topic:string;source?:string;summary?:string;tags?:string[]}){const f=file(root);let all:LearningRecord[]=[];try{all=JSON.parse(await fs.readFile(f,'utf8'))}catch{};const rec={id:crypto.randomUUID(),topic:input.topic,source:input.source??'manual',summary:input.summary??`Learning mission: ${input.topic}`,score:80,createdAt:new Date().toISOString(),tags:input.tags??[]};all.unshift(rec);await fs.mkdir(root,{recursive:true});await fs.writeFile(f,JSON.stringify(all,null,2));return rec}
export async function listLearning(root:string){try{return JSON.parse(await fs.readFile(file(root),'utf8')) as LearningRecord[]}catch{return []}}
