import argparse,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from data.pipeline import prepare
p=argparse.ArgumentParser();p.add_argument("--data_dir",default="data/raw");p.add_argument("--out_dir",default="data/processed");a=p.parse_args()
print(prepare(a.data_dir,a.out_dir))
