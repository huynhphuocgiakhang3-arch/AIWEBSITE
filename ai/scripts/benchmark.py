import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from evaluation.runner import run

def fake(prompt):
    # Smoke harness only; replace with model inference in a real benchmark.
    return "export default function Button({label}: {label: string}) { return <button type='button' aria-label='button' className='x'>{label}</button> } display:flex; gap:8px; flex-wrap:wrap; const x=input.value.trim(); type User = { id:number; name:string }"

if __name__=="__main__":
    r=run(fake);print("accuracy:",r["accuracy"]);print(r)
