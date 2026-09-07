# HPGK v2.0 upgrade

## Product direction
HPGK is now positioned as an Autonomous AI Engineering OS rather than a chat wrapper.

### Core loops
1. Understand mission
2. Plan work
3. Execute tools
4. Verify output
5. Critique quality
6. Repair failures
7. Persist lessons

### Learning
The learning engine stores durable learning missions separately from model inference. A real deployment should connect the learning API to a trusted web/search provider and require source scoring before ingestion.

### Model gateway
The model layer is provider-neutral and supports OpenAI-compatible endpoints. The endpoint is configured server-side through `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`. No secret is exposed to the browser.

### Project builder
`POST /api/projects` creates a real starter workspace, not just a database record. Future versions can extend this with package installation, code generation, build/test loops, visual QA and deployment adapters.

## UI
The visual system is intentionally original: compact telemetry, mission cards, graphite surfaces, electric light accents and an adaptive engineering workspace. It does not copy Grok or ChatGPT layouts.
