# HPGK AGENT v0.5 — Vercel

## Deploy

Import the GitHub repository into Vercel.

```text
Framework Preset: Next.js
Root Directory: .
Build Command: npm run build
Install Command: npm install
```

Set these environment variables after the inference worker has a public HTTPS URL:

```text
HPGK_INFERENCE_URL=https://YOUR-WORKER-DOMAIN
```

Recommended for a public worker:

```text
HPGK_WORKER_TOKEN=YOUR_SHARED_SECRET
```

Redeploy after changing environment variables.

## Endpoints

- `/` — HPGK AGENT Web Studio
- `/api/health` — web health
- `/api/version` — version metadata
- `/api/worker-health` — server-side worker check
- `/api/chat` — SSE chat proxy
- `/api/code` — SSE coding-agent proxy

The Python AI core is not executed by Vercel. The browser talks to same-origin Vercel routes; those routes proxy to the independent worker.
