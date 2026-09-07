import type { AICompletionRequest, AICompletionResult, AIProvider } from './types';
export function createOpenAICompatibleProvider(opts:{id:string;baseUrl:string;apiKey:string;model:string}):AIProvider{
 return {id:opts.id,isConfigured:()=>Boolean(opts.apiKey&&opts.baseUrl&&opts.model),async complete(req:AICompletionRequest):Promise<AICompletionResult>{
  try{const r=await fetch(`${opts.baseUrl.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${opts.apiKey}`},body:JSON.stringify({model:opts.model,messages:req.messages,max_tokens:req.maxTokens??4096})});
   const j=await r.json().catch(()=>({})); if(!r.ok)return {ok:false,errorCode:'provider_error',message:j?.error?.message??`Provider HTTP ${r.status}`};
   const content=j?.choices?.[0]?.message?.content; if(typeof content!=='string')return {ok:false,errorCode:'provider_error',message:'Provider trả về response không hợp lệ.'};
   return {ok:true,content,model:j?.model??opts.model};
  }catch(e){return {ok:false,errorCode:'provider_error',message:e instanceof Error?e.message:String(e)}}
 }};
}
