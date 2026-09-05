import torch
from torch.utils.data import Dataset
class TokenDataset(Dataset):
    def __init__(self,tokens,block_size):
        if len(tokens)<=block_size+1: raise ValueError("Not enough tokens")
        self.data=torch.tensor(tokens,dtype=torch.long); self.block_size=block_size
    def __len__(self): return len(self.data)-self.block_size-1
    def __getitem__(self,i):
        return self.data[i:i+self.block_size],self.data[i+1:i+self.block_size+1]
