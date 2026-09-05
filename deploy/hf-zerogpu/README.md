# HPGK AGENT — optional Hugging Face ZeroGPU serving lane

This is an optional on-demand serving target. It does NOT run 24/7 and is quota-limited. Free personal accounts in good standing can host up to 2 ZeroGPU Spaces; current Hugging Face docs state ZeroGPU is Gradio-only and free accounts receive a limited daily GPU quota.

Set Space hardware to ZeroGPU, add `HF_MODEL_REPO` and (if private) `HF_TOKEN` as secrets, then upload this folder to the Space.

The Vercel app can call the Space through a small adapter if you choose to enable this lane.
