from pathlib import Path
import torch
from model.bpe import BPETokenizer
from model.config import ModelConfig
from model.transformer import VietCodeGPT
from training.checkpoint import load

class ModelRuntime:
    def __init__(self, checkpoint='checkpoints/v0.4.pt', tokenizer='artifacts/tokenizer/tokenizer.json', device=None):
        self.checkpoint=Path(checkpoint); self.tokenizer_path=Path(tokenizer)
        self.device=device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.model=None; self.tokenizer=None; self.meta={}
    @property
    def ready(self): return self.model is not None and self.tokenizer is not None
    def load(self):
        if not self.checkpoint.exists():
            raise FileNotFoundError(f'Missing checkpoint: {self.checkpoint}')
        if not self.tokenizer_path.exists():
            raise FileNotFoundError(f'Missing tokenizer: {self.tokenizer_path}')
        ckpt=torch.load(self.checkpoint,map_location=self.device,weights_only=False)
        cfg=ModelConfig.from_dict(ckpt['config']); self.model=VietCodeGPT(cfg).to(self.device)
        self.model.load_state_dict(ckpt['model']); self.model.eval(); self.tokenizer=BPETokenizer.load(self.tokenizer_path)
        self.meta={'step':ckpt.get('step',0),'epoch':ckpt.get('epoch',0),'val_loss':ckpt.get('val_loss'),'device':self.device}
        return self
