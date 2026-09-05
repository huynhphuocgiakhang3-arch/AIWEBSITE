import json
from pathlib import Path
from datetime import datetime,timezone
class ExperienceStore:
    def __init__(self,path="data/experiences.jsonl"):
        self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True)
    def record(self,task,attempt,result,lesson,score):
        row={"task":task,"attempt":attempt,"result":result,"lesson":lesson,"score":score,
             "created_at":datetime.now(timezone.utc).isoformat()}
        with self.path.open("a",encoding="utf-8") as f:f.write(json.dumps(row,ensure_ascii=False)+"\n")
