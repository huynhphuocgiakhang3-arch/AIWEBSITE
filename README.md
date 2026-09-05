# HPGK AGENT v0.5
### Vietnamese-first Web Coding AI — from-zero training stack

V0.3 is a substantial upgrade over v0.2. It is still a research prototype, but the architecture now separates:

- Web Studio
- tokenizer training
- dataset cleaning / deduplication / splitting
- Transformer training
- real code-oriented evaluation
- knowledge validation
- experience memory
- model registry + promotion/rollback

## No API / no pretrained model

The model starts from random weights. No external AI inference API is used.

The website is deployable as a Next.js app and currently uses a transparent demo inference layer. The Python core is intentionally separated so it can later run as an independent inference worker.

## New in v0.3

### 1. Subword tokenizer
A compact BPE-style tokenizer is included. It learns merges from your own corpus instead of shipping a pretrained vocabulary.

### 2. Dataset pipeline
`ai/data/pipeline.py` can:

- read `.txt` and `.md`
- normalize Unicode
- remove control characters
- normalize whitespace
- split documents
- deduplicate exact documents
- split train/validation/test
- emit JSONL metadata

### 3. Coding evaluation
`ai/evaluation/` includes:

- Python syntax validation
- HTML structural smoke checks
- CSS/JS/TS/React/Next.js heuristic checks
- a benchmark runner
- score aggregation

The evaluator is deliberately transparent. It is not claimed to be a perfect judge.

### 4. Continual-learning gate
New knowledge is never immediately promoted into training.

```text
candidate
   ↓
quality gate
   ↓
validated
   ↓
training candidate
   ↓
train new checkpoint
   ↓
benchmark
   ↓
promote OR rollback
```

### 5. Web Studio
The UI now has:

- Chat
- Code Lab
- Knowledge
- Learning
- Evaluation
- Model Registry
- responsive layout
- code editor-like workspace
- system telemetry cards

## Install

### Website

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:3000.

### AI core

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate

pip install -r ai/requirements.txt
```

## Train tokenizer

```bash
python ai/scripts/build_tokenizer.py --data_dir ai/data/raw --vocab_size 1000
```

This creates a tokenizer vocabulary in `ai/artifacts/tokenizer/`.

## Prepare dataset

```bash
python ai/scripts/prepare_data.py --data_dir ai/data/raw
```

Output:

```text
ai/data/processed/train.jsonl
ai/data/processed/val.jsonl
ai/data/processed/test.jsonl
```

## Train the model

For a small smoke test:

```bash
python ai/scripts/train_demo.py
```

For your own corpus:

```bash
python ai/scripts/train.py --data_dir ai/data/raw --epochs 1
```

Training is checkpointed and has a configurable session time limit so the machine does not have to stay running indefinitely.

## Run benchmark

```bash
python ai/scripts/benchmark.py
```

## Daily learning

The daily learner only processes supplied or approved documents:

```bash
python ai/scripts/learn_once.py --title "CSS Grid" --source "my-notes" --file ai/data/raw/example_web.md
```

It validates the candidate and records the result. It does NOT blindly modify model weights.

## Important reality check

A from-scratch model with a small architecture and a small corpus will not become ChatGPT-level. Intelligence comes from scale, data quality, optimization, and extensive evaluation.

The goal of v0.3 is to make the **research loop correct and extensible**, so future versions can scale without replacing the whole project.

## V0.5 direction

- more efficient tokenizer
- packed binary dataset
- instruction tuning format
- stronger code execution sandbox
- retrieval layer
- larger model configs
- mixed precision
- gradient accumulation
- learning-rate scheduler
- checkpoint averaging
- regression benchmark
- optional ephemeral compute adapters


## Vercel deployment (v0.3)

The repository root is now Vercel-ready. No API key or environment variable is required for demo mode.

```text
Root Directory: .
Build Command: npm run build
Install Command: npm install
Framework: Next.js
```

The `/ai` directory is not executed during the Vercel build.


## v0.3.1 Vercel build fix

The Web Studio JSX has been corrected and the root deployment package is ready for Vercel.


## v0.5 inference worker
The independent Python worker lives in `ai/inference/`. It is not invoked by Vercel. Start it only after a real checkpoint exists.

## Brand
**HPGK AGENT** — Vietnamese-first Code Intelligence.

## V0.5 — real worker connection

The web now proxies `/api/chat` to the worker's `/stream` endpoint and `/api/code` to `/code/stream`. Set `HPGK_INFERENCE_URL` in Vercel to the worker's public HTTPS URL. The browser sends bounded conversation context and open code files; the worker streams generated text using SSE.

See `INFERENCE-DEPLOY.md` for the exact setup.
