# HPGK AGENT v0.5 — connect Web to the real worker

## Architecture

```text
Browser
  │
  ▼
Vercel /api/chat or /api/code
  │  (server-side proxy)
  ▼
HTTPS inference worker
  │
  ├─ context builder
  ├─ tokenizer
  └─ random-init Transformer checkpoint
```

The browser never needs the worker's direct URL. Vercel proxies the request, which keeps the architecture cleaner and avoids CORS in the browser.

## 1. Train a checkpoint

From `ai/` dependencies:

```bash
pip install -r ai/requirements.txt
python ai/scripts/train.py --data_dir ai/data/raw --epochs 1
```

This creates the configured checkpoint. The model must actually be trained before it can produce useful code.

## 2. Start the worker

```bash
python ai/inference/server.py --host 0.0.0.0 --port 8787 --checkpoint checkpoints/v0.4.pt --tokenizer artifacts/tokenizer/tokenizer.json
```

Test:

```bash
curl http://127.0.0.1:8787/health
```

## 3. Give the worker an HTTPS public address

Vercel cannot call a private `127.0.0.1` or LAN address. The worker must be reachable through a public HTTPS endpoint. Use compute you control; do not put model secrets in the browser.

## 4. Vercel environment variable

Set:

```text
HPGK_INFERENCE_URL=https://YOUR-WORKER-DOMAIN
```

Redeploy after changing the variable.

## Streaming protocol

The worker returns Server-Sent Events:

```text
event: start
data: {...}

event: token
data: {"text":"..."}

event: token
data: {"text":"..."}

event: done
data: {"text":"..."}
```

The Web Studio consumes this stream through `/api/chat` and `/api/code`.

## Context

The browser sends recent conversation messages. The worker caps context at 24 messages and truncates each message to prevent unbounded prompts.

## Coding workflow

Code Lab sends:

- task
- recent context
- open files

The worker builds a coding prompt and streams the model's response. V0.5 intentionally does **not** execute generated code or write files on the worker. That is reserved for a sandboxed agent layer after isolation is implemented.

## Health check

The Web Studio can call:

```text
/api/worker-health
```

which checks `HPGK_INFERENCE_URL` server-side.

## Security

Before exposing the worker publicly, add authentication/rate limiting at your hosting layer. The included CORS header is permissive for development; the Vercel proxy means the browser does not need direct worker access.

## Optional worker authentication

For a public worker, set the same random secret on both sides:

```text
Vercel:
HPGK_WORKER_TOKEN=...

Worker:
python ai/inference/server.py ... --token "..."
```

The browser never receives this token; Vercel sends it server-to-server.
