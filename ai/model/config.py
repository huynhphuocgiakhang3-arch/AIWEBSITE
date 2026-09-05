from dataclasses import dataclass,asdict
import json
from pathlib import Path

@dataclass
class ModelConfig:
    vocab_size:int=1000
    block_size:int=256
    n_layer:int=6
    n_head:int=6
    n_embd:int=384
    dropout:float=0.0
    def to_dict(self): return asdict(self)
    def save(self,path): Path(path).write_text(json.dumps(self.to_dict(),indent=2),encoding="utf-8")
    @classmethod
    def from_dict(cls,d): return cls(**{k:d[k] for k in cls.__dataclass_fields__ if k in d})
