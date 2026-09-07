# Gemini verification

HPGK never shows “Gemini ready” just because a variable exists. `/api/gemini/status` performs a real tiny generation request. The green state means that request succeeded.

On Vercel, add `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in Project Settings → Environment Variables, then redeploy. Environment-variable changes apply to new deployments.
