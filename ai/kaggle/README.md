# HPGK AGENT v0.6 — Kaggle training lane

This lane is intentionally separate from Vercel. Kaggle is used for short GPU sessions; checkpoints are resumable.

## Workflow
1. Upload/publish `ai/data/raw` as a Kaggle Dataset or attach it to a Notebook.
2. Open `notebooks/HPGK_AGENT_v0.6_Kaggle.ipynb`.
3. Enable a GPU accelerator.
4. Run the cells. The notebook saves checkpoints and a model manifest.
5. Optionally set `HF_TOKEN` and `HF_MODEL_REPO` to publish the checkpoint to a Hugging Face model repository.
6. Resume later with `--resume` instead of retraining from zero.

Kaggle GPU availability/quota is variable. This project never assumes 24/7 compute.
