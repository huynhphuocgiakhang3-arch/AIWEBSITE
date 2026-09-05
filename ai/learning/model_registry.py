import json
from pathlib import Path
class ModelRegistry:
    def __init__(self,path="data/model_registry.json"):
        self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True)
        if not self.path.exists():self.path.write_text(json.dumps({"active":None,"versions":[]},indent=2),encoding="utf-8")
    def _get(self):return json.loads(self.path.read_text(encoding="utf-8"))
    def register(self,version,checkpoint,score,notes=""):
        d=self._get();d["versions"].append({"version":version,"checkpoint":checkpoint,"score":score,"notes":notes})
        self.path.write_text(json.dumps(d,indent=2,ensure_ascii=False),encoding="utf-8")
    def promote(self,version):
        d=self._get();target=next(x for x in d["versions"] if x["version"]==version)
        active=next((x for x in d["versions"] if x["version"]==d["active"]),None)
        if active is None or target["score"]>=active["score"]:
            d["active"]=version;self.path.write_text(json.dumps(d,indent=2,ensure_ascii=False),encoding="utf-8");return True
        return False
