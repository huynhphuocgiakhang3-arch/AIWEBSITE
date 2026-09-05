from pathlib import Path
import hashlib,json,re,unicodedata,random

def normalize(text):
    text=unicodedata.normalize("NFC",text)
    text="".join(c for c in text if c in "\n\t\r" or ord(c)>=32)
    text=re.sub(r"[ \t]+"," ",text)
    text=re.sub(r"\n{3,}","\n\n",text)
    return text.strip()

def read_documents(data_dir):
    docs=[]
    for p in sorted(Path(data_dir).rglob("*")):
        if p.suffix.lower() in {".txt",".md"}:
            raw=p.read_text(encoding="utf-8",errors="ignore"); clean=normalize(raw)
            if len(clean)>=20: docs.append({"path":str(p),"text":clean})
    return docs

def dedupe(docs):
    seen=set(); out=[]
    for d in docs:
        h=hashlib.sha256(d["text"].encode()).hexdigest()
        if h in seen: continue
        seen.add(h); d["sha256"]=h; out.append(d)
    return out

def split_documents(docs,seed=42,val=.1,test=.1):
    rng=random.Random(seed); docs=list(docs); rng.shuffle(docs)
    n=len(docs); nv=int(n*val); nt=int(n*test)
    return docs[nt+nv:],docs[nt:nt+nv],docs[:nt]

def write_jsonl(rows,path):
    path=Path(path); path.parent.mkdir(parents=True,exist_ok=True)
    with path.open("w",encoding="utf-8") as f:
        for r in rows: f.write(json.dumps(r,ensure_ascii=False)+"\n")

def prepare(data_dir,out_dir):
    docs=dedupe(read_documents(data_dir))
    tr,va,te=split_documents(docs)
    for name,rows in [("train",tr),("val",va),("test",te)]: write_jsonl(rows,Path(out_dir)/(name+".jsonl"))
    return {"total":len(docs),"train":len(tr),"val":len(va),"test":len(te)}
