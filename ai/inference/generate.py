import torch
def generate(model,tokenizer,prompt,device,max_new_tokens=120):
 ids=tokenizer.encode(prompt);x=torch.tensor([ids],dtype=torch.long,device=device);return tokenizer.decode(model.generate(x,max_new_tokens)[0].tolist())
