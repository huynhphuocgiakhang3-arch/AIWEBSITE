import argparse,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import torch
from data.pipeline import read_documents
from data.dataset import TokenDataset
from model.bpe import BPETokenizer
from model.config import ModelConfig
from model.transformer import VietCodeGPT
from training.trainer import train
from training.seed import seed_everything

p=argparse.ArgumentParser();p.add_argument("--data_dir",default="data/raw");p.add_argument("--epochs",type=int,default=1);p.add_argument("--vocab_size",type=int,default=1000);p.add_argument("--max_minutes",type=int,default=45);a=p.parse_args()
seed_everything(42);text="\n\n".join(x["text"] for x in read_documents(a.data_dir));tok=BPETokenizer().train(text,a.vocab_size);ids=tok.encode(text);n=int(len(ids)*.9);cfg=ModelConfig(vocab_size=tok.vocab_size,block_size=256,n_layer=6,n_head=6,n_embd=384);model=VietCodeGPT(cfg);opt=torch.optim.AdamW(model.parameters(),lr=3e-4);device="cuda" if torch.cuda.is_available() else "cpu";tok.save("artifacts/tokenizer/tokenizer.json");print("device",device,"parameters",sum(p.numel() for p in model.parameters()));train(model,TokenDataset(ids[:n],cfg.block_size),TokenDataset(ids[n:],cfg.block_size),opt,a.epochs,4,device,"checkpoints/v0.4.pt",cfg.to_dict(),a.max_minutes,100,"artifacts/tokenizer/tokenizer.json")
