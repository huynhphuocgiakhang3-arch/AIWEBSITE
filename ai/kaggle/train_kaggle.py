import argparse, json, os, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import torch
from data.pipeline import read_documents
from data.dataset import TokenDataset
from model.bpe import BPETokenizer
from model.config import ModelConfig
from model.transformer import VietCodeGPT
from training.trainer import train
from training.seed import seed_everything

ROOT=Path(__file__).resolve().parents[1]

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--data_dir',default=str(ROOT/'data/raw'))
    p.add_argument('--epochs',type=int,default=1)
    p.add_argument('--vocab_size',type=int,default=4000)
    p.add_argument('--max_minutes',type=int,default=45)
    p.add_argument('--resume',action='store_true')
    p.add_argument('--checkpoint',default=str(ROOT/'checkpoints/hpgk-v0.6.pt'))
    a=p.parse_args()
    seed_everything(42)
    docs=read_documents(a.data_dir)
    if not docs: raise SystemExit('No training documents found.')
    text='\n\n'.join(x['text'] for x in docs)
    tok_path=ROOT/'artifacts/tokenizer/tokenizer.json'; tok_path.parent.mkdir(parents=True,exist_ok=True)
    if a.resume and Path(a.checkpoint).exists() and tok_path.exists():
        tok=BPETokenizer.load(str(tok_path))
        print('reusing tokenizer', tok_path)
    else:
        tok=BPETokenizer().train(text,a.vocab_size)
        tok.save(str(tok_path))
    ids=tok.encode(text); split=max(1,int(len(ids)*.9))
    cfg=ModelConfig(vocab_size=tok.vocab_size,block_size=256,n_layer=6,n_head=6,n_embd=384)
    model=VietCodeGPT(cfg); opt=torch.optim.AdamW(model.parameters(),lr=3e-4)
    device='cuda' if torch.cuda.is_available() else 'cpu'
    ckpt=Path(a.checkpoint); ckpt.parent.mkdir(parents=True,exist_ok=True)
    if a.resume and ckpt.exists():
        data=torch.load(ckpt,map_location='cpu')
        model.load_state_dict(data['model'])
        if data.get('optimizer'): opt.load_state_dict(data['optimizer'])
        print('resumed',ckpt)
    params=sum(p.numel() for p in model.parameters())
    print(json.dumps({'device':device,'documents':len(docs),'tokens':len(ids),'parameters':params,'checkpoint':str(ckpt)}))
    train(model,TokenDataset(ids[:split],cfg.block_size),TokenDataset(ids[split:],cfg.block_size),opt,a.epochs,8 if device=='cuda' else 2,device,str(ckpt),cfg.to_dict(),a.max_minutes,100,str(tok_path))
    meta={'project':'HPGK AGENT','version':'0.6.1','parameters':params,'tokens':len(ids),'documents':len(docs),'device':device,'checkpoint':str(ckpt),'tokenizer':str(tok_path),'created_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
    (ckpt.parent/'manifest.json').write_text(json.dumps(meta,indent=2))
    print(json.dumps(meta,indent=2))

if __name__=='__main__': main()
