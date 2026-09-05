import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import torch
from model.bpe import BPETokenizer
from model.config import ModelConfig
from model.transformer import VietCodeGPT
from data.pipeline import read_documents,split_documents
from data.dataset import TokenDataset
from training.trainer import train
from training.seed import seed_everything

def main():
    seed_everything(42); text=("Bạn là VIETCODE AI. HTML CSS JavaScript TypeScript React Next.js. "*1500)
    tok=BPETokenizer().train(text,500); tokens=tok.encode(text); cut=int(len(tokens)*.9)
    tr=tokens[:cut];va=tokens[cut:]
    cfg=ModelConfig(vocab_size=tok.vocab_size,block_size=128,n_layer=3,n_head=4,n_embd=128)
    model=VietCodeGPT(cfg);opt=torch.optim.AdamW(model.parameters(),lr=3e-4);device="cuda" if torch.cuda.is_available() else "cpu"
    print("device",device,"vocab",tok.vocab_size,"parameters",sum(p.numel() for p in model.parameters()))
    tok.save("artifacts/tokenizer/demo.json")
    train(model,TokenDataset(tr,cfg.block_size),TokenDataset(va,cfg.block_size),opt,2,8,device,"checkpoints/v0.3-demo.pt",cfg.to_dict(),max_minutes=15,checkpoint_every=50,"artifacts/tokenizer/demo.json")
if __name__=="__main__":main()
