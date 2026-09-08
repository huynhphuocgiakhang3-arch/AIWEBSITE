# KHANGHUYNH // VERCEL FORENSIC ENGINE v3

A real deployment-forensics web app for Vercel projects. Vietnamese UI, ZIP/project ingestion, deterministic root-cause analysis, conservative safe-fix gate, GitHub atomic commit, Vercel deployment trigger and live deployment/event monitoring.

## Core promise

**Do not guess. Do not redesign the user's project. Do not auto-edit UI topology.**

The engine records a baseline of the uploaded source tree. Safe patches are rejected if they change the detected UI file topology. Only deterministic patches with explicit rules are eligible for auto-fix.

## Flow

1. Upload ZIP or project folder.
2. Paste the Vercel log.
3. Run forensic scan.
4. Review concise root-cause findings with file/line and confidence.
5. Optional safe auto-fix.
6. Push one atomic Git commit to GitHub.
7. Trigger/monitor Vercel deployment with a live timer.
8. If deployment fails, ingest build events and run another forensic cycle.
9. Stop when READY, when no deterministic fix exists, or after the configured cycle limit.

## Important architecture limitation

A browser/Vercel serverless function cannot reliably reproduce every arbitrary user build environment. v3 therefore treats **Vercel itself as the final build oracle**. The local engine performs static and deterministic checks; the Vercel build/events are the authoritative deployment verification step.

For a future worker edition, add an isolated build runner/container to execute `npm/pnpm/yarn build` before pushing.

## GitHub

The app uses GitHub's Git Database flow: read branch ref → create tree → create commit → update branch. A fine-grained token needs repository Contents write permission.

## Security

- Tokens are held in browser state and sent only to the relevant server route.
- No token is written to a database by this source.
- `.env*`, `.git`, `node_modules`, `.next` are excluded from uploaded source.
- Never paste a token into a public log.
- Rotate a token immediately if it is accidentally exposed.

## Branding

Every generated release archive and root project directory is branded **Khanghuynh**.
