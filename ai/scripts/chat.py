import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import torch
from model.bpe import BPETokenizer
from model.config import ModelConfig
from model.transformer import VietCodeGPT
from training.checkpoint import load
from inference.generate import generate

path=Path("checkpoints/v0.3-demo.pt")
if not path.exists():raise SystemExit("Run: python ai/scripts/train_demo.py")
tok=BPETokenizer.load("artifacts/tokenizer/demo.json");cfg=ModelConfig(vocab_size=tok.vocab_size,block_size=128,n_layer=3,n_head=4,n_embd=128);model=VietCodeGPT(cfg);load(path,model,device="cpu");model.eval()
while True:
    q=input("\nBạn: ")
    if q.lower()=="exit":break
    print("AI:",generate(model,tok,q,"cpu"))
