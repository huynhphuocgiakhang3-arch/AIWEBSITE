import torch
import torch.nn as nn
import torch.nn.functional as F
from .config import ModelConfig

class CausalSelfAttention(nn.Module):
    def __init__(self,cfg):
        super().__init__(); assert cfg.n_embd%cfg.n_head==0
        self.h=cfg.n_head; self.d=cfg.n_embd//cfg.n_head
        self.qkv=nn.Linear(cfg.n_embd,3*cfg.n_embd); self.proj=nn.Linear(cfg.n_embd,cfg.n_embd)
        self.drop=nn.Dropout(cfg.dropout)
        self.register_buffer("mask",torch.tril(torch.ones(cfg.block_size,cfg.block_size)).view(1,1,cfg.block_size,cfg.block_size))
    def forward(self,x):
        B,T,C=x.shape; q,k,v=self.qkv(x).split(C,-1)
        q=q.view(B,T,self.h,self.d).transpose(1,2); k=k.view(B,T,self.h,self.d).transpose(1,2); v=v.view(B,T,self.h,self.d).transpose(1,2)
        s=(q@k.transpose(-2,-1))/(self.d**.5); s=s.masked_fill(self.mask[:,:,:T,:T]==0,float("-inf"))
        w=self.drop(F.softmax(s,-1)); y=(w@v).transpose(1,2).contiguous().view(B,T,C)
        return self.drop(self.proj(y))

class Block(nn.Module):
    def __init__(self,cfg):
        super().__init__(); self.ln1=nn.LayerNorm(cfg.n_embd); self.attn=CausalSelfAttention(cfg); self.ln2=nn.LayerNorm(cfg.n_embd)
        self.mlp=nn.Sequential(nn.Linear(cfg.n_embd,4*cfg.n_embd),nn.GELU(),nn.Linear(4*cfg.n_embd,cfg.n_embd),nn.Dropout(cfg.dropout))
    def forward(self,x): x=x+self.attn(self.ln1(x)); return x+self.mlp(self.ln2(x))

class VietCodeGPT(nn.Module):
    def __init__(self,cfg):
        super().__init__(); self.cfg=cfg
        self.token=nn.Embedding(cfg.vocab_size,cfg.n_embd); self.pos=nn.Embedding(cfg.block_size,cfg.n_embd); self.drop=nn.Dropout(cfg.dropout)
        self.blocks=nn.Sequential(*[Block(cfg) for _ in range(cfg.n_layer)]); self.ln=nn.LayerNorm(cfg.n_embd); self.head=nn.Linear(cfg.n_embd,cfg.vocab_size,bias=False)
        self.head.weight=self.token.weight; self.apply(self._init)
    def _init(self,m):
        if isinstance(m,nn.Linear): nn.init.normal_(m.weight,0,.02); m.bias is not None and nn.init.zeros_(m.bias)
        elif isinstance(m,nn.Embedding): nn.init.normal_(m.weight,0,.02)
    def forward(self,idx,targets=None):
        B,T=idx.shape
        if T>self.cfg.block_size: raise ValueError("Sequence too long")
        p=torch.arange(T,device=idx.device); x=self.drop(self.token(idx)+self.pos(p)); x=self.blocks(x); logits=self.head(self.ln(x))
        loss=None if targets is None else F.cross_entropy(logits.reshape(-1,logits.size(-1)),targets.reshape(-1))
        return logits,loss
    @torch.no_grad()
    def generate(self,idx,max_new_tokens=160,temperature=.8,top_k=50):
        self.eval()
        for _ in range(max_new_tokens):
            logits,_=self(idx[:,-self.cfg.block_size:]); logits=logits[:,-1]/max(temperature,1e-5)
            if top_k:
                v,_=torch.topk(logits,min(top_k,logits.size(-1))); logits[logits<v[:,-1,None]]=float("-inf")
            idx=torch.cat([idx,torch.multinomial(F.softmax(logits,-1),1)],1)
        return idx
