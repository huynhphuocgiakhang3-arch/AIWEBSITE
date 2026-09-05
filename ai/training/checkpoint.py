from pathlib import Path
import torch

def save(path,model,opt,step,epoch,train_loss,val_loss,cfg,tokenizer_path=None):
    Path(path).parent.mkdir(parents=True,exist_ok=True)
    torch.save({"model":model.state_dict(),"optimizer":opt.state_dict(),"step":step,"epoch":epoch,
                "train_loss":train_loss,"val_loss":val_loss,"config":cfg,"tokenizer":tokenizer_path},path)

def load(path,model,opt=None,device="cpu"):
    c=torch.load(path,map_location=device,weights_only=False); model.load_state_dict(c["model"])
    if opt is not None and "optimizer" in c: opt.load_state_dict(c["optimizer"])
    return c
