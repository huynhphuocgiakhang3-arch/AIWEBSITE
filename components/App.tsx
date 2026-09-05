'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type Role = 'user' | 'ai'
type Msg = { role: Role; text: string }
type FileTab = { name: string; content: string }

const initial: Msg[] = [{
  role: 'ai',
  text: 'Xin chào. Tôi là HPGK AGENT v0.5.\n\nWeb Studio đã sẵn sàng cho inference worker thật. Nếu HPGK_INFERENCE_URL chưa được cấu hình hoặc worker chưa có checkpoint, tôi sẽ báo trạng thái thay vì giả lập AI.'
}]

const nav = ['Chat', 'Code Lab', 'Knowledge', 'Learning', 'Evaluation', 'Model Registry']

async function readSSE(response: Response, onToken: (text: string) => void, onDone: (text: string) => void) {
  if (!response.body) throw new Error('Worker không trả về stream.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() || ''
    for (const event of events) {
      const lines = event.split('\n')
      const type = lines.find(x => x.startsWith('event:'))?.slice(6).trim()
      const raw = lines.find(x => x.startsWith('data:'))?.slice(5).trim()
      if (!raw) continue
      let data: any
      try { data = JSON.parse(raw) } catch { continue }
      if (type === 'token') { full += String(data.text || ''); onToken(String(data.text || '')) }
      if (type === 'done') onDone(String(data.text ?? full))
      if (type === 'error') throw new Error(String(data.message || data.error || 'Inference error'))
    }
  }
  onDone(full)
}

export default function App() {
  const [section, setSection] = useState('Chat')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>(initial)
  const [busy, setBusy] = useState(false)
  const [worker, setWorker] = useState<'checking' | 'ready' | 'offline'>('checking')
  const [files, setFiles] = useState<FileTab[]>([{ name: 'main.tsx', content: "export default function App() {\n  return <main>Hello HPGK</main>\n}\n" }])
  const [activeFile, setActiveFile] = useState('main.tsx')
  const [codeTask, setCodeTask] = useState('Tối ưu component này cho mobile và giải thích thay đổi.')
  const [codeOutput, setCodeOutput] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetch('/api/worker-health', { cache: 'no-store' }).then(async r => {
      const data = await r.json().catch(() => ({}))
      setWorker(data?.upstream?.ready ? 'ready' : 'offline')
    }).catch(() => setWorker('offline'))
  }, [])

  const metrics = useMemo(() => [
    ['Core', 'Transformer'], ['Context', '24 msgs'], ['Streaming', 'SSE'], ['Worker', worker === 'ready' ? 'Online' : 'Offline']
  ], [worker])

  function stop() { abortRef.current?.abort(); abortRef.current = null; setBusy(false) }

  async function send() {
    const x = input.trim(); if (!x || busy) return
    const next = [...messages, { role: 'user' as const, text: x }]
    setMessages([...next, { role: 'ai', text: '' }]); setInput(''); setBusy(true)
    const controller = new AbortController(); abortRef.current = controller
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'content-type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.text })), max_new_tokens: 220, temperature: .72 })
      })
      if (!response.ok) { const d = await response.json().catch(() => ({})); throw new Error(d.message || d.error || `HTTP ${response.status}`) }
      await readSSE(response, token => setMessages(m => { const a = [...m]; a[a.length - 1] = { role: 'ai', text: a[a.length - 1].text + token }; return a }), text => setMessages(m => { const a=[...m]; a[a.length-1]={role:'ai',text}; return a }))
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setMessages(m => { const a=[...m]; a[a.length-1]={role:'ai',text:`Không thể gọi inference worker.\n\n${(e as Error).message}`}; return a })
    } finally { setBusy(false); abortRef.current = null }
  }

  async function runCodeAgent() {
    if (busy) return
    const active = files.find(f => f.name === activeFile)
    setBusy(true); setCodeOutput(''); const controller = new AbortController(); abortRef.current = controller
    try {
      const response = await fetch('/api/code', {
        method: 'POST', headers: { 'content-type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ task: codeTask, files, context: messages.slice(-12).map(m => ({ role: m.role, content: m.text })), max_new_tokens: 320, temperature: .68 })
      })
      if (!response.ok) { const d=await response.json().catch(()=>({})); throw new Error(d.message || d.error || `HTTP ${response.status}`) }
      await readSSE(response, token => setCodeOutput(x => x + token), text => setCodeOutput(text))
      void active
    } catch (e) { if ((e as Error).name !== 'AbortError') setCodeOutput(`Agent error: ${(e as Error).message}`) }
    finally { setBusy(false); abortRef.current=null }
  }

  const activeContent = files.find(f => f.name === activeFile)?.content || ''
  function updateActive(content: string) { setFiles(fs => fs.map(f => f.name === activeFile ? { ...f, content } : f)) }

  const panels: Record<string, ReactNode> = {
    'Code Lab': <div className="studio"><div className="editorPane"><div className="tabbar">{files.map(f => <button key={f.name} className={'tab '+(f.name===activeFile?'on':'')} onClick={()=>setActiveFile(f.name)}>{f.name}</button>)}</div><textarea className="editor" value={activeContent} onChange={e=>updateActive(e.target.value)} spellCheck={false}/></div><div className="agentPane"><div className="card"><h3>Coding Agent</h3><textarea className="task" value={codeTask} onChange={e=>setCodeTask(e.target.value)} /><div className="actions"><button className="send" onClick={runCodeAgent} disabled={busy}>{busy?'Đang chạy…':'Run Agent'}</button>{busy&&<button className="tab" onClick={stop}>Stop</button>}</div></div><div className="card"><h3>Agent output</h3><div className="output">{codeOutput || 'Agent sẽ nhận task + file đang mở + 12 message gần nhất.'}</div></div></div></div>,
    'Knowledge': <><div className="card"><h3>Context & Knowledge</h3><div className="code">conversation → recent context → worker prompt → model</div></div><div className="notice">V0.5 gửi context có giới hạn. Knowledge store vẫn tách khỏi prompt để tránh biến mọi dữ liệu thành context không kiểm soát.</div></>,
    'Learning': <><div className="card"><h3>Continual learning gate</h3>{[['Candidate queue','READY'],['Checkpoint','ENABLED'],['Benchmark gate','REQUIRED'],['Unsafe auto-update','OFF']].map(([a,b])=><div className="row" key={a}><span>{a}</span><b className="value">{b}</b></div>)}</div><div className="code">candidate → validate → train → benchmark → promote / rollback</div></>,
    'Evaluation': <><div className="card"><h3>Coding benchmark</h3>{['HTML structure','CSS layout','JavaScript','TypeScript','React','Next.js'].map(x=><div className="row" key={x}><span>{x}</span><span className="value">READY</span></div>)}</div><div className="empty">Execution sandbox chưa bật. V0.5 chỉ gửi task và code context tới worker.</div></>,
    'Model Registry': <><div className="card"><h3>Release gate</h3>{[['Active channel','v0.5'],['Inference','REAL WORKER'],['Streaming','SSE'],['Promotion','Benchmark-gated']].map(([a,b])=><div className="row" key={a}><span>{a}</span><span className="value">{b}</span></div>)}</div><div className="notice">Model thật chỉ được dùng khi worker có checkpoint + tokenizer hợp lệ.</div></>
  }

  return <div className="app"><header className="top"><div className="brand"><div className="mark">H</div>HPGK AGENT <span>CODE INTELLIGENCE</span></div><div className="status"><i className={worker==='ready'?'live':'off'}/>{worker==='ready'?'WORKER ONLINE':'WORKER OFFLINE'} · v0.5</div></header><div className="layout"><aside className="side"><div className="label">Workspace</div>{nav.slice(0,5).map(x=><button key={x} onClick={()=>setSection(x)} className={'nav '+(section===x?'active':'')}>{x}</button>)}<div className="label">System</div><button onClick={()=>setSection('Model Registry')} className={'nav '+(section==='Model Registry'?'active':'')}>Model Registry</button></aside><main className="main"><section className="hero"><div className="eyebrow">From-zero · Vietnamese-first · Code-first</div><h1>Build. Learn. Verify.</h1><p>HPGK AGENT v0.5 nối Web Studio với inference worker thật, giữ context có giới hạn, streaming SSE và coding workflow tách biệt.</p><div className="metrics">{metrics.map(([a,b])=><div className="metric" key={a}><small>{a}</small><b>{b}</b></div>)}</div></section>{section==='Chat'?<section className="surface"><div className="head"><b>AI Chat</b><span className="status">{worker==='ready'?'LIVE INFERENCE':'NO WORKER'}</span></div><div className="body"><div className="messages">{messages.map((m,i)=><div className={'msg '+m.role} key={i}><small>{m.role==='ai'?'HPGK AGENT':'YOU'}</small>{m.text}{busy&&i===messages.length-1&&m.role==='ai'&&<span className="cursor"/>}</div>)}</div><div className="compose"><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Ví dụ: debug lỗi React này..."/><button className="send" onClick={send} disabled={busy}>{busy?'…':'Gửi'}</button>{busy&&<button className="tab" onClick={stop}>Stop</button>}</div></div></section>:<section className="surface"><div className="head"><b>{section}</b><span className="status">v0.5</span></div><div className="body">{panels[section]}</div></section>}</main><aside className="right"><div className="card"><h3>Runtime</h3>{[['Web Studio','Ready'],['Inference',worker==='ready'?'Online':'Offline'],['Streaming','SSE'],['Context','Capped']].map(([a,b])=><div className="row" key={a}><span>{a}</span><span className="value">{b}</span></div>)}</div><div className="card"><h3>Architecture</h3><div className="code">{'Browser\n ↓\nVercel API proxy\n ↓\nHTTPS worker\n ↓\nTokenizer\n ↓\nTransformer'}</div></div><div className="card"><h3>Safety</h3><div className="notice">Worker không tự ghi file và không execute code ở V0.5. Coding agent chỉ phân tích task + context + file.</div></div></aside></div></div>
}
