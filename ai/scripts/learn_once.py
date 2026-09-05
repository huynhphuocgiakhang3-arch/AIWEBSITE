import argparse,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from learning.queue import LearningQueue
from learning.gate import validate
p=argparse.ArgumentParser();p.add_argument("--title",required=True);p.add_argument("--source",required=True);p.add_argument("--file",required=True);a=p.parse_args()
content=Path(a.file).read_text(encoding="utf-8",errors="ignore");q=LearningQueue();row=q.add(a.title,content,a.source);ok,reason=validate(row);q.set_status(row["id"],"validated" if ok else "rejected");print({"id":row["id"],"status":"validated" if ok else "rejected","reason":reason})
