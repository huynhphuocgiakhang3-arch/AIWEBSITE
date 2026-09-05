import json
from pathlib import Path
class KnowledgeStore:
    def __init__(self,path="data/knowledge.jsonl"):
        self.path=Path(path); self.path.parent.mkdir(parents=True,exist_ok=True)
    def add(self,item):
        with self.path.open("a",encoding="utf-8") as f:f.write(json.dumps(item,ensure_ascii=False)+"\n")
    def all(self):
        if not self.path.exists():return []
        return [json.loads(x) for x in self.path.read_text(encoding="utf-8").splitlines() if x.strip()]
