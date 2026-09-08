import {ProjectFile,projectManifest} from './forensic';
export function verifyUiIntegrity(before:ProjectFile[],after:ProjectFile[]){
 const a=projectManifest(before),b=projectManifest(after);
 const same=a.uiFiles.length===b.uiFiles.length&&a.uiFiles.every((x,i)=>x===b.uiFiles[i]);
 return {ok:same,uiFilesBefore:a.uiFiles.length,uiFilesAfter:b.uiFiles.length,reason:same?'UI file topology unchanged':'UI file topology changed — patch rejected'};
}
export function stripUnsafeFiles(files:ProjectFile[]){return files.filter(f=>!/(^|\/)(\.env(?:\..*)?|node_modules|\.next|\.git)(\/|$)/i.test(f.path));}
