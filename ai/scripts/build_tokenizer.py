import argparse,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from data.pipeline import read_documents
from model.bpe import BPETokenizer
p=argparse.ArgumentParser();p.add_argument("--data_dir",default="data/raw");p.add_argument("--vocab_size",type=int,default=1000);a=p.parse_args()
text="\n\n".join(x["text"] for x in read_documents(a.data_dir)); tok=BPETokenizer().train(text,a.vocab_size); tok.save("artifacts/tokenizer/tokenizer.json");print("vocab_size=",tok.vocab_size)
