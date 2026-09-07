'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };
type Conversation = { id: string; title: string; updatedAt: string };
type FileItem = { path: string; content: string };
type Mode = 'chat' | 'edit';

const suggestions = [
  { icon: '⌘', title: 'Build a website', text: 'Tạo website hoàn chỉnh từ ý tưởng của tôi' },
  { icon: '✦', title: 'Fix my project', text: 'Sửa lỗi và cải thiện project hiện tại' },
  { icon: '◈', title: 'Explain code', text: 'Giải thích code, kiến trúc hoặc thuật toán' },
  { icon: '◎', title: 'Research', text: 'Tìm hiểu một công nghệ hoặc cách triển khai' },
];

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9\s-_]/g, '').trim().replace(/\s+/g, '-').slice(0, 48) || 'hpgk-project'; }
function makeStarter(prompt: string): FileItem[] {
  const title = prompt.trim().replace(/\s+/g, ' ').slice(0, 80) || 'Premium AI Website';
  return [
    { path: 'README.md', content: `# ${title}\n\nCreated with HPGK.\n` },
    { path: 'package.json', content: JSON.stringify({ name: slugify(title), private: true, version: '1.0.0', scripts: { dev: 'next dev', build: 'next build', start: 'next start' }, dependencies: { next: 'latest', react: 'latest', 'react-dom': 'latest' } }, null, 2) },
    { path: 'app/page.tsx', content: `export default function Home(){\n  return <main><h1>${title.replace(/[<>]/g, '')}</h1><p>Built with HPGK.</p></main>;\n}\n` },
    { path: 'app/layout.tsx', content: `export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}\n` },
    { path: 'app/globals.css', content: `*{box-sizing:border-box}html,body{margin:0;background:#070912;color:#fff;font-family:Inter,system-ui,sans-serif}body{min-height:100vh}main{min-height:100vh;display:grid;place-content:center;padding:48px}h1{font-size:clamp(40px,7vw,88px);letter-spacing:-.05em;max-width:900px}p{color:#9ba4b8;font-size:18px}` },
  ];
}

export default function Home() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('Gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.7-flash');
  const [keyOpen, setKeyOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [repoName, setRepoName] = useState('');
  const [privateRepo, setPrivateRepo] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [project, setProject] = useState<FileItem[]>([]);
  const [projectName, setProjectName] = useState('');
  const [mode, setMode] = useState<Mode>('chat');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('hpgk-project-v22');
      if (raw) { const data = JSON.parse(raw) as { name: string; files: FileItem[] }; setProjectName(data.name); setProject(data.files); }
    } catch { /* ignore corrupt local state */ }
    fetch('/api/conversations').then((r) => r.json()).then((d) => setConversations(d.conversations ?? [])).catch(() => {});
  }, []);

  useEffect(() => { if (!repoName && projectName) setRepoName(projectName); }, [projectName, repoName]);

  const activeTitle = useMemo(() => conversations.find((c) => c.id === conversationId)?.title ?? '', [conversations, conversationId]);
  function notify(text: string) { setToast(text); window.setTimeout(() => setToast(''), 2800); }
  function newChat() { setConversationId(null); setMessages([]); setInput(''); setMode('chat'); setHistoryOpen(false); setMenuOpen(false); setTimeout(() => inputRef.current?.focus(), 80); }
  async function openConversation(id: string) {
    const res = await fetch(`/api/conversations/${id}`); const data = await res.json();
    if (!res.ok) return notify(data.error ?? 'Không thể mở cuộc trò chuyện.');
    setConversationId(id); setMessages(data.conversation.messages ?? []); setHistoryOpen(false);
  }
  async function persistMessage(id: string, message: Message) { await fetch(`/api/conversations/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message }) }); }
  async function ensureConversation(userText: string) {
    if (conversationId) return conversationId;
    const res = await fetch('/api/conversations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: userText }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Không tạo được cuộc trò chuyện.');
    const id = data.conversation.id as string;
    setConversationId(id);
    setConversations((old) => [{ id, title: data.conversation.title, updatedAt: data.conversation.updatedAt }, ...old]);
    return id;
  }
  function saveProject(name: string, files: FileItem[]) {
    setProjectName(name); setProject(files); localStorage.setItem('hpgk-project-v22', JSON.stringify({ name, files }));
  }
  function createProjectFromPrompt(text: string) {
    const files = makeStarter(text); saveProject(slugify(text), files); setMode('edit'); notify('Đã tạo project local. Gemini có thể sửa trực tiếp project này.');
  }

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setInput(''); setSending(true);
    const userMessage: Message = { role: 'user', content: text };
    const id = await ensureConversation(text);
    setMessages((m) => [...m, userMessage]);
    if (id) await persistMessage(id, userMessage);

    try {
      if (mode === 'edit') {
        if (!project.length) { createProjectFromPrompt(text); notify('Chưa có project — HPGK đã tạo starter để Gemini có thể chỉnh sửa.'); return; }
        const res = await fetch('/api/gemini/edit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey: geminiKey || undefined, model: geminiModel, instruction: text, files: project }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Gemini edit failed.');
        const map = new Map(project.map((f) => [f.path, f.content]));
        for (const op of data.operations ?? []) { if (op.action === 'delete') map.delete(op.path); else map.set(op.path, op.content ?? ''); }
        const next = Array.from(map, ([path, content]) => ({ path, content })); saveProject(projectName || 'hpgk-project', next);
        const answer = `${data.summary || 'Đã sửa project.'}\n\nĐã cập nhật ${data.operations?.length ?? 0} file.`;
        const assistant = { role: 'assistant' as const, content: answer }; setMessages((m) => [...m, assistant]); await persistMessage(id, assistant); notify('Gemini đã sửa project trực tiếp.');
      } else {
        if (model === 'Gemini') {
          const history = [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }));
          const res = await fetch('/api/gemini/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey: geminiKey || undefined, model: geminiModel, messages: [{ role: 'system', content: 'You are HPGK, a concise senior coding assistant. Answer in the user language. When asked to build or edit a project, explain what you would change and offer the project edit mode.' }, ...history] }) });
          const data = await res.json(); if (!res.ok) throw new Error(data.error ?? 'Gemini request failed.');
          const assistant = { role: 'assistant' as const, content: data.content }; setMessages((m) => [...m, assistant]); await persistMessage(id, assistant);
        } else {
          const assistant = { role: 'assistant' as const, content: 'HPGK local mode đang sẵn sàng. Chọn Gemini để bật suy luận thật, hoặc dùng “Chỉnh project” để sửa project hiện tại.' }; setMessages((m) => [...m, assistant]); await persistMessage(id, assistant);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra.';
      if (/API key|Gemini/i.test(message)) setKeyOpen(true);
      const assistant = { role: 'assistant' as const, content: `Không thực hiện được: ${message}` }; setMessages((m) => [...m, assistant]); await persistMessage(id, assistant);
    } finally { setSending(false); }
  }

  async function deployGithub() {
    if (!githubToken.trim()) return notify('Nhập GitHub token trước.');
    if (!project.length) return notify('Chưa có project để deploy.');
    setDeploying(true);
    try {
      const res = await fetch('/api/github/deploy', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: githubToken, repoName: repoName || projectName || 'hpgk-project', private: privateRepo, files: project }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error ?? 'GitHub deploy failed.');
      setGithubToken(''); setGithubOpen(false); notify(`Đã deploy ${data.uploaded} file lên GitHub.`);
      window.open(data.repository, '_blank', 'noopener,noreferrer');
    } catch (e) { notify(e instanceof Error ? e.message : 'Không thể deploy GitHub.'); } finally { setDeploying(false); }
  }

  function chooseSuggestion(text: string, title: string) {
    if (title === 'Build a website') setMode('edit');
    setInput(text); setTimeout(() => inputRef.current?.focus(), 50);
  }

  return <div className="shell">
    <aside className={`sidebar ${historyOpen ? 'open' : ''}`}>
      <div className="sideTop"><button className="iconBtn" onClick={() => setHistoryOpen(false)} aria-label="Close sidebar">☰</button><div className="brand"><span className="brandMark">✦</span><span>HPGK</span></div><button className="iconBtn" onClick={() => newChat()} aria-label="New chat">＋</button></div>
      <button className="newChat" onClick={newChat}><span>＋</span> Cuộc trò chuyện mới</button>
      <div className="historySearch">⌕ <span>Tìm kiếm cuộc trò chuyện...</span><kbd>⌘K</kbd></div>
      <div className="historyList">{conversations.length ? conversations.map((c) => <button key={c.id} className={`historyItem ${c.id === conversationId ? 'active' : ''}`} onClick={() => openConversation(c.id)}><span className="historyIcon">◈</span><span><b>{c.title}</b><small>{relative(c.updatedAt)}</small></span></button>) : <div className="historyEmpty">Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây.</div>}</div>
      <div className="sideBottom"><button className="profile"><span className="avatar">G</span><span><b>HPGK</b><small>{geminiKey ? 'Gemini ready' : 'Local mode'}</small></span><span className="more">•••</span></button></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="mobileMenu iconBtn" onClick={() => setHistoryOpen(true)}>☰</button>
        <div className="crumb">{activeTitle || 'HPGK'}</div>
        <div className="topActions">
          <button className="modelBtn" onClick={() => setKeyOpen(true)}><span className="spark">✦</span>{model}<span>⌄</span></button>
          <button className="githubBtn" onClick={() => setGithubOpen(true)}>◉ <span>Deploy to GitHub</span></button>
          <button className="iconBtn" onClick={() => setMenuOpen((v) => !v)}>•••</button>
          <span className="avatar topAvatar">G</span>
        </div>
      </header>

      {messages.length === 0 ? <section className="welcome">
        <div className="welcomeGlow" />
        <div className="heroMark">✦</div>
        <div className="eyebrow">AI CODING ASSISTANT</div>
        <h1>Xin chào, Gia Khang.</h1>
        <p>Tạo, sửa và hoàn thiện project cùng HPGK. Giao diện đơn giản như một cuộc trò chuyện — sức mạnh nằm phía sau.</p>
        <div className="suggestions">{suggestions.map((s) => <button key={s.title} className="suggestion" onClick={() => chooseSuggestion(s.text, s.title)}><span className="suggestionIcon">{s.icon}</span><span><b>{s.title}</b><small>{s.text}</small></span><i>→</i></button>)}</div>
      </section> : <section className="conversation"><div className="messages">{messages.map((m, i) => <div key={`${m.role}-${i}`} className={`message ${m.role}`}><div className="messageAvatar">{m.role === 'assistant' ? '✦' : 'G'}</div><div className="messageBody"><div className="messageName">{m.role === 'assistant' ? 'HPGK' : 'Bạn'}</div><div className="messageText">{m.content}</div></div></div>)}{sending && <div className="message assistant"><div className="messageAvatar">✦</div><div className="messageBody"><div className="messageName">HPGK</div><div className="typing"><i/><i/><i/></div></div></div>}</div></section>}

      <div className="composerWrap">
        {project.length > 0 && <div className="projectBar"><span className="dot"/><b>{projectName}</b><span>{project.length} files</span><button onClick={() => setMode(mode === 'edit' ? 'chat' : 'edit')}>{mode === 'edit' ? 'Chỉnh project' : 'Chat'}</button><button onClick={() => setGithubOpen(true)}>Deploy</button></div>}
        <div className="composer">
          <button className="plus" onClick={() => setMenuOpen((v) => !v)}>＋</button>
          <textarea ref={inputRef} rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder={mode === 'edit' ? 'Mô tả thay đổi bạn muốn Gemini thực hiện...' : 'Nhập yêu cầu của bạn...'} />
          <div className="composerRight"><button className="miniModel" onClick={() => setKeyOpen(true)}>✦ Gemini ⌄</button><button className={`send ${input.trim() ? 'ready' : ''}`} onClick={() => void send()} disabled={sending || !input.trim()}>↑</button></div>
        </div>
        {menuOpen && <div className="composerMenu"><button onClick={() => { setMode('chat'); setMenuOpen(false); }}>✦ Chat với Gemini</button><button onClick={() => { setMode('edit'); setMenuOpen(false); if (!project.length) notify('Hãy tạo project trước bằng “Build a website”.'); }}>⌘ Chỉnh project bằng Gemini</button><button onClick={() => { setMenuOpen(false); if (!project.length) createProjectFromPrompt('Premium AI coding project'); else notify('Project hiện tại đã sẵn sàng.'); }}>＋ Tạo project local</button></div>}
        <div className="composerHint">HPGK · {model === 'Gemini' ? 'Gemini' : 'Local'} · Không lưu API key vào trình duyệt</div>
      </div>
    </main>

    {keyOpen && <Modal title="Gemini" onClose={() => setKeyOpen(false)}><p className="modalLead">Bật Gemini để HPGK trả lời thật và chỉnh project trực tiếp. API key chỉ được gửi cho server request và không được lưu vào localStorage.</p><label>Gemini API key<input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="AIza..." autoFocus /></label><label>Model<input value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} /></label><div className="modalActions"><button onClick={() => setKeyOpen(false)}>Hủy</button><button className="primary" onClick={() => { setKeyOpen(false); notify(geminiKey ? 'Gemini đã sẵn sàng.' : 'HPGK sẽ dùng GEMINI_API_KEY trên server nếu có.'); }}>Lưu phiên này</button></div></Modal>}
    {githubOpen && <Modal title="Deploy to GitHub" onClose={() => !deploying && setGithubOpen(false)}><p className="modalLead">HPGK sẽ dùng token bạn nhập để tạo/cập nhật repository và upload project. Token không được lưu.</p><label>GitHub token<input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="github_pat_..." autoFocus /></label><label>Repository name<input value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder={projectName || 'hpgk-project'} /></label><label className="check"><input type="checkbox" checked={privateRepo} onChange={(e) => setPrivateRepo(e.target.checked)} /> Repository private</label><div className="modalActions"><button onClick={() => setGithubOpen(false)} disabled={deploying}>Hủy</button><button className="primary" onClick={() => void deployGithub()} disabled={deploying}>{deploying ? 'Đang deploy…' : 'Deploy'}</button></div></Modal>}
    {toast && <div className="toast">{toast}</div>}
  </div>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="overlay" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modalHead"><h2>{title}</h2><button className="iconBtn" onClick={onClose}>×</button></div>{children}</div></div>; }
function relative(iso: string) { const d = Date.now() - new Date(iso).getTime(); if (d < 60_000) return 'vừa xong'; if (d < 3_600_000) return `${Math.floor(d / 60_000)} phút trước`; if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} giờ trước`; return `${Math.floor(d / 86_400_000)} ngày trước`; }
