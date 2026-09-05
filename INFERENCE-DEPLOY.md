# Inference in v0.6

The old always-on worker model is no longer the default. V0.6 uses on-demand compute.

If you have an eligible Hugging Face ZeroGPU Space, deploy the optional template under `deploy/hf-zerogpu` and expose it through a suitable adapter. Otherwise keep `HPGK_INFERENCE_URL` empty; Vercel will remain functional and show `On-demand`.

Do not put HF tokens in browser code.
