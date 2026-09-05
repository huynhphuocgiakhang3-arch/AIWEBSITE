# VIETCODE-AI v0.3.1 — Vercel deployment

This is the Vercel build-fix release. The previous build failed because `components/App.tsx` contained invalid JSX/string syntax in the Code Lab panel. That code has been rewritten using valid JSX and TypeScript.

## Vercel settings

- Framework: Next.js
- Root Directory: `.`
- Build Command: `npm run build`
- Install Command: `npm install`
- Environment Variables: none required

After deployment, check `/api/health` and `/api/version`.

The Python AI core in `/ai` is not executed by the Vercel build.
