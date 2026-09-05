import fs from 'node:fs'; import path from 'node:path';
const k=path.resolve('knowledge/index.json'); const x=JSON.parse(fs.readFileSync(k,'utf8'));
console.log({entries:x.manifest.entries,domains:x.manifest.domains,packs:x.manifest.packs});
