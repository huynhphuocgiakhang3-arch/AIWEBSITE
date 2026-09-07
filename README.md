# HPGK Agent v2.2 — Focused AI Coding Assistant

HPGK v2.2 is intentionally focused: a premium chat UI, conversation history, Gemini chat/project editing, and GitHub deployment.

## Features
- Chat-first UI with hamburger history + new chat button.
- Optional Gemini integration via `GEMINI_API_KEY` or a per-session key entered in the UI.
- Gemini can return structured file operations so HPGK can edit the current project directly.
- Local project state is kept in the browser for the demo workflow.
- GitHub deployment asks for a token only when you choose Deploy; the token is not persisted.
- Responsive desktop/mobile UI.

## Run

```bash
npm install
npm run dev
```

For server-side Gemini:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.7-flash
```

Do not expose the Gemini key in client-side code. HPGK accepts a session key only for the current requests and does not store it in localStorage.

## GitHub token
The deploy endpoint uses GitHub REST API. For an existing repository, the token needs Contents write permission. Creating a new repository may require the appropriate repository administration permission. See GitHub's current fine-grained token permissions.
