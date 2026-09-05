# VIETCODE-AI v0.3 — Vercel deployment

## Recommended
Import the repository into Vercel with **Root Directory = repository root**.

The root already contains:
- package.json
- next.config.mjs
- app/
- components/

So no Root Directory change is required.

Build command:
`npm run build`

No environment variables are required for v0.3 demo mode.

After deployment:
- `/` = Web Studio
- `/api/health` = health check
- `/api/version` = version/architecture metadata

## Important
The Python AI core under `ai/` is not executed by Vercel. It remains the from-zero training/evaluation stack and can later be connected to a separate inference worker.

Do not upload large `.pt` checkpoints to the web deployment.

## If your GitHub repo already has another app
Either use this package as the repository root, or set Vercel Root Directory to the folder containing this `package.json`.
