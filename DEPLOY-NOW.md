# HPGK AGENT v0.6.1 — Deploy now

## GitHub → Vercel

1. Replace the contents of your `AIWEBSITE` repository with this ZIP.
2. Commit to `main`.
3. In Vercel, keep:
   - Framework: Next.js
   - Build command: `npm run build`
   - Install command: `npm install`
   - Root directory: `/`
4. Redeploy.

No AI API key is required for the web build. `HPGK_INFERENCE_URL` is optional at this stage.

## What should work immediately

- Landing/UI
- Chat interface
- Code Lab UI
- Health/version endpoints
- Worker status UI

The worker will show Offline/On-demand until an inference endpoint is actually available. This is expected.

## Colab

Use `notebooks/colab/HPGK_AGENT_v0.6_Colab.ipynb`. The notebook now stops cleanly if GitHub cloning or GPU setup fails, instead of causing a misleading `requirements.txt` error.
