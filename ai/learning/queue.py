from pathlib import Path
import json,uuid
class LearningQueue:
    VALID={"candidate","validated","accepted","rejected"}
    def __init__(self,path="data/learning_queue.jsonl"):
        self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True)
    def add(self,title,content,source):
        row={"id":uuid.uuid4().hex,"title":title,"content":content,"source":source,"status":"candidate"}
        with self.path.open("a",encoding="utf-8") as f:f.write(json.dumps(row,ensure_ascii=False)+"\n")
        return row
    def rows(self):
        if not self.path.exists():return []
        return [json.loads(x) for x in self.path.read_text(encoding="utf-8").splitlines() if x.strip()]
    def set_status(self,id,status):
        if status not in self.VALID:raise ValueError("invalid status")
        rows=self.rows();changed=False
        for r in rows:
            if r["id"]==id:r["status"]=status;changed=True
        if changed:self.path.write_text("\n".join(json.dumps(r,ensure_ascii=False) for r in rows)+"\n",encoding="utf-8")
        return changed
