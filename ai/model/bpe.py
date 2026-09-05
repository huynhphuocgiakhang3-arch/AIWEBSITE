from collections import Counter,defaultdict
import json
from pathlib import Path

class BPETokenizer:
    """Compact byte-aware BPE tokenizer trained from the user's corpus.

    Base vocabulary is 256 byte tokens. Learned merges are appended as token IDs.
    """

    def __init__(self, merges=None):
        self.merges=merges or []
        self.ranks={tuple(pair):i for i,pair in enumerate(self.merges)}
        self.vocab_size=256+len(self.merges)

    @staticmethod
    def _word_bytes(text):
        return [list(text.encode("utf-8")) for text in text.split() if text]

    def train(self,text,vocab_size=1000,min_pair_freq=2):
        target=max(256,vocab_size)
        words=Counter(tuple(x) for x in self._word_bytes(text))
        merges=[]
        while 256+len(merges)<target:
            pairs=Counter()
            for word,freq in words.items():
                for i in range(len(word)-1): pairs[(word[i],word[i+1])]+=freq
            if not pairs: break
            pair,count=pairs.most_common(1)[0]
            if count<min_pair_freq: break
            merges.append(pair)
            new_words=Counter()
            for word,freq in words.items():
                out=[]; i=0
                while i<len(word):
                    if i<len(word)-1 and (word[i],word[i+1])==pair:
                        out.append(256+len(merges)-1); i+=2
                    else: out.append(word[i]); i+=1
                new_words[tuple(out)]+=freq
            words=new_words
        self.merges=merges
        self.ranks={tuple(p):i for i,p in enumerate(merges)}
        self.vocab_size=256+len(merges)
        return self

    def encode(self,text):
        result=[]
        for word in text.split():
            tokens=list(word.encode("utf-8"))
            while True:
                candidates=[(self.ranks[(tokens[i],tokens[i+1])],i) for i in range(len(tokens)-1) if (tokens[i],tokens[i+1]) in self.ranks]
                if not candidates: break
                _,i=min(candidates)
                rank=self.ranks[(tokens[i],tokens[i+1])]
                tokens=tokens[:i]+[256+rank]+tokens[i+2:]
            result.extend(tokens)
            result.append(32)
        return result[:-1] if result else []

    def decode(self,ids):
        out=bytearray()
        for x in ids:
            if x<256: out.append(x)
            else:
                rank=x-256
                if rank>=len(self.merges): continue
                # recursively expand merge IDs
                stack=[x]
                while stack:
                    y=stack.pop()
                    if y<256: out.append(y); continue
                    a,b=self.merges[y-256]
                    stack.extend([b,a])
        return bytes(out).decode("utf-8",errors="replace")

    def save(self,path):
        Path(path).parent.mkdir(parents=True,exist_ok=True)
        Path(path).write_text(json.dumps({"version":"0.3-bpe","merges":self.merges},ensure_ascii=False),encoding="utf-8")

    @classmethod
    def load(cls,path):
        d=json.loads(Path(path).read_text(encoding="utf-8"))
        return cls([tuple(x) for x in d["merges"]])
