# No-API deployment mode

The default HPGK v2.1 experience does not require an external AI provider or API key.

The visible workflows are local-first and deterministic:
- project scaffolding
- mission orchestration UI
- file inspection
- HTML preview
- local memory
- learning records

This is intentionally different from claiming that a deterministic template engine is a foundation model. True open-ended model inference still requires a model runtime somewhere. HPGK keeps that boundary explicit so the default Vercel deployment stays keyless.
