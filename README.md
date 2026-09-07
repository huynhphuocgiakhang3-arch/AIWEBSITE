# HPGK Agent — v2.1 Local-First Autonomous Engineering OS

HPGK v2.1 is a premium AI-engineering workspace designed to run **without an external AI API key**.

## What works without an API

- Premium responsive workspace UI
- Local project scaffolding from prompts
- Deterministic autonomous mission loop UI
- File explorer + code inspection
- Generated live HTML preview
- Local memory via browser storage
- Local learning records
- Built-in knowledge catalogue
- Mobile/desktop responsive layout

## Important distinction

“No API” here means **no external AI inference API is required by default**. The local engine is deterministic/template-based; it is not a magically retrained foundation model. A future provider can be added behind the same orchestration layer if desired.

## Deploy on Vercel

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Framework: Next.js.
4. Build command: `npm run build`.
5. No environment variables are required for the default local-first mode.

The main UI and core demo workflows do not call Anthropic, OpenAI, Google, OpenRouter, or any other external AI provider.
