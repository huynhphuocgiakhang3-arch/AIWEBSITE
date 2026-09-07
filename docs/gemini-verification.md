# Gemini verification

HPGK does not show Gemini as ready merely because an API key exists.

`POST /api/gemini/status` performs two real checks:

1. `GET /v1beta/models` with the key in the `x-goog-api-key` header.
2. `POST /v1beta/models/{model}:generateContent` with a tiny real prompt.

The UI distinguishes:

- `NO_KEY` — no Vercel `GEMINI_API_KEY` and no session key.
- `INVALID_KEY` — Gemini rejected the credential.
- `PROJECT_DENIED` — Google accepted the key but denied the project (`403 PERMISSION_DENIED`).
- `MODEL_UNAVAILABLE` — the selected model is unavailable.
- `QUOTA` — rate/quota issue.
- `GEMINI_SERVER` — upstream Gemini server error.
- `ready` — a real generation request succeeded.

The API key is sent in the request body from the browser to the HPGK server route, then forwarded to Google using the `x-goog-api-key` header. It is never placed in a URL query string or localStorage.

Default model: `gemini-3.8-flash`.

For Vercel, set:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.8-flash
```

After changing Vercel environment variables, redeploy.
