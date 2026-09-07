import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function safePath(p: string) { return p.replace(/\\/g, '/').replace(/^\/+/, '') && !p.includes('..') && !p.startsWith('.git/'); }
async function gh(url: string, token: string, init: RequestInit = {}) {
  return fetch(`https://api.github.com${url}`, { ...init, headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2026-03-10', 'content-type': 'application/json', ...(init.headers ?? {}) } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? '').trim();
  const repoName = String(body.repoName ?? '').trim().replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const description = String(body.description ?? 'Created with HPGK').slice(0, 200);
  const isPrivate = body.private !== false;
  const files = Array.isArray(body.files) ? body.files as Array<{ path: string; content: string }> : [];
  if (!token) return NextResponse.json({ error: 'Thiếu GitHub token.' }, { status: 400 });
  if (!repoName) return NextResponse.json({ error: 'Thiếu tên repository.' }, { status: 400 });
  if (!files.length || files.length > 120 || files.some((f) => !safePath(f.path))) return NextResponse.json({ error: 'Project files không hợp lệ.' }, { status: 400 });

  const userRes = await gh('/user', token);
  if (!userRes.ok) return NextResponse.json({ error: 'GitHub token không hợp lệ hoặc không có quyền.' }, { status: userRes.status });
  const user = await userRes.json() as { login: string };

  let repoRes = await gh(`/repos/${encodeURIComponent(user.login)}/${encodeURIComponent(repoName)}`, token);
  let created = false;
  if (repoRes.status === 404) {
    repoRes = await gh('/user/repos', token, { method: 'POST', body: JSON.stringify({ name: repoName, description, private: isPrivate, auto_init: true }) });
    if (!repoRes.ok) {
      const err = await repoRes.json().catch(() => ({}));
      return NextResponse.json({ error: err?.message ?? 'Không thể tạo repository. Token cần quyền phù hợp để tạo repo.' }, { status: repoRes.status });
    }
    created = true;
  }
  if (!repoRes.ok) return NextResponse.json({ error: 'Không thể truy cập repository.' }, { status: repoRes.status });
  const repo = await repoRes.json() as { html_url: string; default_branch?: string };

  const results: string[] = [];
  for (const file of files) {
    const encodedPath = file.path.split('/').map(encodeURIComponent).join('/');
    const currentRes = await gh(`/repos/${encodeURIComponent(user.login)}/${encodeURIComponent(repoName)}/contents/${encodedPath}`, token);
    let sha: string | undefined;
    if (currentRes.ok) {
      const current = await currentRes.json() as { sha?: string };
      sha = current.sha;
    }
    const upload = await gh(`/repos/${encodeURIComponent(user.login)}/${encodeURIComponent(repoName)}/contents/${encodedPath}`, token, {
      method: 'PUT',
      body: JSON.stringify({ message: `HPGK: update ${file.path}`, content: Buffer.from(file.content, 'utf8').toString('base64'), branch: repo.default_branch ?? 'main', ...(sha ? { sha } : {}) }),
    });
    if (!upload.ok) {
      const err = await upload.json().catch(() => ({}));
      return NextResponse.json({ error: `Không thể upload ${file.path}: ${err?.message ?? upload.status}`, uploaded: results }, { status: upload.status });
    }
    results.push(file.path);
  }

  return NextResponse.json({ ok: true, created, repository: repo.html_url, owner: user.login, name: repoName, uploaded: results.length });
}
