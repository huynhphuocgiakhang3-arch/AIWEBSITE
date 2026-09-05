import os, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))

repo=os.getenv('HF_MODEL_REPO')
token=os.getenv('HF_TOKEN')
if not repo or not token:
    raise SystemExit('Set HF_MODEL_REPO and HF_TOKEN in Kaggle Secrets.')
from huggingface_hub import HfApi
api=HfApi(token=token)
root=Path(__file__).resolve().parents[1]
api.create_repo(repo_id=repo, repo_type='model', exist_ok=True)
for path in [root/'checkpoints/manifest.json', root/'checkpoints/hpgk-v0.6.pt', root/'artifacts/tokenizer/tokenizer.json']:
    if path.exists(): api.upload_file(path_or_fileobj=str(path), path_in_repo=path.name, repo_id=repo, repo_type='model')
print('published',repo)
