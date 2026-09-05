# HPGK AGENT inference worker — v0.4

The worker is intentionally independent from Vercel and uses only Python standard-library HTTP plus the project's PyTorch core.

## Start

After training a checkpoint:

```bash
python -m ai.inference.server --checkpoint ai/checkpoints/v0.4.pt --tokenizer ai/artifacts/tokenizer/tokenizer.json
```

Endpoints:

- `GET /health`
- `GET /`
- `POST /generate`

Example body:

```json
{"prompt":"Viết component React Button","max_new_tokens":160,"temperature":0.8}
```

V0.4 does **not** connect this worker to the Vercel UI yet. That separation keeps deployment simple and makes the worker replaceable.
