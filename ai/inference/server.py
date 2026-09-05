#!/usr/bin/env python3
"""HPGK AGENT inference worker.

Endpoints:
  GET  /health
  GET  /
  POST /generate       -> JSON completion
  POST /stream         -> SSE streaming chat completion
  POST /code/stream    -> SSE coding-agent workflow

The worker is intentionally independent from Vercel. Put it on compute that can
run Python + PyTorch and expose HTTPS to the Vercel deployment.
"""
import argparse, json, sys, time, traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from inference.model_loader import ModelRuntime
from inference.generate import generate, stream_generate

runtime = None
MAX_BODY = 256_000
MAX_CONTEXT_MESSAGES = 24
WORKER_TOKEN = ''


def sse(handler, event, data):
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    handler.wfile.write(f"event: {event}\ndata: {payload}\n\n".encode('utf-8'))
    handler.wfile.flush()


def clean_messages(value):
    if not isinstance(value, list):
        return []
    out = []
    for item in value[-MAX_CONTEXT_MESSAGES:]:
        if not isinstance(item, dict):
            continue
        role = str(item.get('role', 'user'))[:16]
        text = str(item.get('content', item.get('text', '')))[:12_000].strip()
        if text:
            out.append({'role': role, 'content': text})
    return out


def make_chat_prompt(messages, system='Bạn là HPGK AGENT, một coding AI ưu tiên tiếng Việt.'):
    lines = [f"System: {system[:3000]}"]
    for m in messages:
        lines.append(f"{m['role'].capitalize()}: {m['content']}")
    lines.append('Assistant:')
    return '\n\n'.join(lines)


def make_code_prompt(task, files, context):
    lines = [
        'System: Bạn là HPGK AGENT, coding agent tiếng Việt.',
        'Mục tiêu: phân tích task, xem context/files, đề xuất thay đổi code rõ ràng.',
        f'Task: {task[:12000]}',
    ]
    if context:
        lines.append('Conversation context:\n' + make_chat_prompt(context, '')[:20000])
    if isinstance(files, list):
        for f in files[:12]:
            if isinstance(f, dict):
                name = str(f.get('name', 'file'))[:200]
                content = str(f.get('content', ''))[:30000]
                lines.append(f'FILE: {name}\n```\n{content}\n```')
    lines.append('Agent response:')
    return '\n\n'.join(lines)


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, fmt, *args):
        print('[worker]', fmt % args)

    def _json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(data)

    def _authorized(self):
        if not WORKER_TOKEN:
            return True
        header = self.headers.get('Authorization', '')
        return header == f'Bearer {WORKER_TOKEN}'

    def _body(self):
        length = int(self.headers.get('Content-Length', '0'))
        if length <= 0 or length > MAX_BODY:
            raise ValueError('invalid_body_size')
        return json.loads(self.rfile.read(length) or b'{}')

    def _stream_headers(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
        self.send_header('Cache-Control', 'no-cache, no-transform')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('X-Accel-Buffering', 'no')
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'content-type, authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            return self._json(200, {'ok': True, 'service': 'hpgk-agent-inference', 'ready': runtime.ready, 'meta': runtime.meta})
        if self.path == '/':
            return self._json(200, {'service': 'HPGK AGENT inference worker', 'version': '0.5.0', 'endpoints': ['/health', '/generate', '/stream', '/code/stream']})
        return self._json(404, {'error': 'not_found'})

    def do_POST(self):
        if not self._authorized():
            return self._json(401, {'error': 'unauthorized'})
        if self.path == '/generate':
            return self.generate_json()
        if self.path in ('/stream', '/code/stream'):
            return self.stream(self.path == '/code/stream')
        return self._json(404, {'error': 'not_found'})

    def generate_json(self):
        if not runtime.ready:
            return self._json(503, {'error': 'model_not_ready', 'message': 'Train and load a checkpoint before inference.'})
        try:
            body = self._body()
            prompt = str(body.get('prompt', '')).strip()
            if not prompt: return self._json(400, {'error': 'prompt_required'})
            max_new = max(1, min(int(body.get('max_new_tokens', 160)), 512))
            temperature = max(.05, min(float(body.get('temperature', .8)), 1.5))
            started = time.perf_counter()
            text = generate(runtime.model, runtime.tokenizer, prompt, runtime.device, max_new, temperature)
            return self._json(200, {'ok': True, 'text': text, 'latency_ms': round((time.perf_counter()-started)*1000, 2), 'model': runtime.meta})
        except Exception as exc:
            traceback.print_exc()
            return self._json(500, {'error': 'inference_error', 'message': str(exc)})

    def stream(self, code_mode=False):
        if not runtime.ready:
            return self._json(503, {'error': 'model_not_ready', 'message': 'Train and load a checkpoint before inference.'})
        try:
            body = self._body()
            if code_mode:
                task = str(body.get('task', '')).strip()
                if not task: return self._json(400, {'error': 'task_required'})
                prompt = make_code_prompt(task, body.get('files', []), clean_messages(body.get('context', [])))
            else:
                messages = clean_messages(body.get('messages', []))
                if not messages: return self._json(400, {'error': 'messages_required'})
                prompt = make_chat_prompt(messages, str(body.get('system', '')))
            max_new = max(1, min(int(body.get('max_new_tokens', 220 if code_mode else 160)), 512))
            temperature = max(.05, min(float(body.get('temperature', .75)), 1.5))
            self._stream_headers()
            started = time.perf_counter()
            sse(self, 'start', {'ok': True, 'mode': 'code' if code_mode else 'chat', 'model': runtime.meta})
            last = ''
            for cumulative in stream_generate(runtime.model, runtime.tokenizer, prompt, runtime.device, max_new, temperature):
                delta = cumulative[len(last):] if cumulative.startswith(last) else cumulative
                last = cumulative
                if delta: sse(self, 'token', {'text': delta})
            sse(self, 'done', {'text': last, 'latency_ms': round((time.perf_counter()-started)*1000, 2)})
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception as exc:
            traceback.print_exc()
            try: sse(self, 'error', {'error': 'inference_error', 'message': str(exc)})
            except Exception: pass


def main():
    global runtime
    p = argparse.ArgumentParser()
    p.add_argument('--host', default='0.0.0.0')
    p.add_argument('--port', type=int, default=8787)
    p.add_argument('--checkpoint', default='checkpoints/v0.4.pt')
    p.add_argument('--tokenizer', default='artifacts/tokenizer/tokenizer.json')
    p.add_argument('--token', default='', help='Optional bearer token for the public worker')
    a = p.parse_args()
    global WORKER_TOKEN
    WORKER_TOKEN = a.token
    runtime = ModelRuntime(a.checkpoint, a.tokenizer)
    try:
        runtime.load(); print('model loaded:', runtime.meta)
    except FileNotFoundError as e:
        print('worker started without model:', e)
    server = ThreadingHTTPServer((a.host, a.port), Handler)
    print(f'HPGK AGENT inference worker: http://{a.host}:{a.port}')
    server.serve_forever()

if __name__ == '__main__': main()
