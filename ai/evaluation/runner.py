from .cases import CASES
from .static_checks import keyword_score,web_checks

def run(generate_fn):
    rows=[]
    for case in CASES:
        out=generate_fn(case["prompt"])
        score=keyword_score(out,case["checks"])
        ok=score>=.67
        rows.append({"id":case["id"],"score":score,"passed":ok,"output":out})
    passed=sum(r["passed"] for r in rows)
    return {"passed":passed,"total":len(rows),"accuracy":passed/max(1,len(rows)),"cases":rows}
