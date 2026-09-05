import time,torch
from torch.utils.data import DataLoader
from .checkpoint import save

@torch.no_grad()
def evaluate(model,dataset,batch_size,device,max_batches=40):
    model.eval(); loader=DataLoader(dataset,batch_size=batch_size,shuffle=False,drop_last=True); total=n=0
    for i,(x,y) in enumerate(loader):
        if i>=max_batches: break
        _,loss=model(x.to(device),y.to(device)); total+=loss.item(); n+=1
    return total/max(1,n)

def train(model,train_ds,val_ds,opt,epochs,batch_size,device,checkpoint_path,cfg,max_minutes=45,checkpoint_every=100,tokenizer_path=None):
    model.to(device); loader=DataLoader(train_ds,batch_size=batch_size,shuffle=True,drop_last=True); started=time.time(); step=0
    for epoch in range(epochs):
        model.train(); total=n=0
        for x,y in loader:
            if (time.time()-started)/60>=max_minutes:
                val=evaluate(model,val_ds,batch_size,device); save(checkpoint_path,model,opt,step,epoch,total/max(1,n),val,cfg,tokenizer_path); return
            opt.zero_grad(set_to_none=True); _,loss=model(x.to(device),y.to(device)); loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(),1.0); opt.step()
            total+=loss.item(); n+=1; step+=1
            if step%20==0: print(f"epoch={epoch+1} step={step} loss={loss.item():.4f}")
            if step%checkpoint_every==0:
                val=evaluate(model,val_ds,batch_size,device); save(checkpoint_path,model,opt,step,epoch,total/n,val,cfg,tokenizer_path)
        val=evaluate(model,val_ds,batch_size,device); avg=total/max(1,n)
        save(checkpoint_path,model,opt,step,epoch+1,avg,val,cfg,tokenizer_path)
        print(f"epoch={epoch+1} train={avg:.4f} val={val:.4f}")
